import { NextRequest, NextResponse } from 'next/server';
import { getSql, writeAuditLog } from '@/lib/db';
import { ROLE_PROFILES, UserRole } from '@/lib/governance';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const role = (body.actorRole || 'LEGAL_FINANCE') as UserRole;
    const actor = ROLE_PROFILES[role] || ROLE_PROFILES.LEGAL_FINANCE;

    if (!actor.canIssueContract) {
      return NextResponse.json(
        { error: 'Akses Ditolak (RBAC): Penerbitan kontrak digital + e-Meterai hanya dapat dieksekusi oleh Legal/Finance, VP, atau Direksi.' },
        { status: 403 }
      );
    }

    const quoteId = Number(body.quoteId);
    const contractType = String(body.contractType || 'KONTRAK_EPC');
    const psreProvider = String(body.psreProvider || 'PERURI_SIGN');

    const sql = getSql();
    const quotes = await sql`
      SELECT q.*, d.pipeline_mode, d.account_id, a.kyc_status
      FROM crm_quotations q
      JOIN crm_deals d ON d.id = q.deal_id
      LEFT JOIN crm_accounts a ON a.id = d.account_id
      WHERE q.id = ${quoteId}
    `;
    if (quotes.length === 0) {
      return NextResponse.json({ error: 'Quotation tidak ditemukan.' }, { status: 404 });
    }

    const q = quotes[0];
    if (q.approval_status !== 'APPROVED' && q.approval_status !== 'AUTO_APPROVED') {
      return NextResponse.json(
        { error: 'Kontrak belum dapat diterbitkan karena Quotation belum berstatus APPROVED.' },
        { status: 400 }
      );
    }
    if (q.kyc_status && q.kyc_status !== 'VERIFIED') {
      return NextResponse.json(
        { error: 'Blokir Kepatuhan Legal: Dokumen KYC klien (NIK/NPWP/NIB) wajib berstatus VERIFIED sebelum penerbitan kontrak.' },
        { status: 400 }
      );
    }

    const countRes = await sql`SELECT COUNT(*)::int AS cnt FROM crm_contracts`;
    const nextNum = Number(countRes[0].cnt || 0) + 1;
    const docTag = q.pipeline_mode === 'MPC_PROPERTI' ? 'PPJB-MPC' : 'SPK-EPC';
    const contractNumber = `MPC/LEG/${docTag}/2026/${String(nextNum).padStart(3, '0')}`;
    const emeteraiSerial = `PERURI-EM-2611${String(Math.floor(10000000 + Math.random() * 89999999))}`;

    const inserted = await sql`
      INSERT INTO crm_contracts (
        contract_number, deal_id, quote_id, contract_type,
        emeterai_serial, emeterai_status, psre_provider, sign_status,
        contract_value, retention_pct, signed_at
      ) VALUES (
        ${contractNumber}, ${q.deal_id}, ${q.id}, ${contractType},
        ${emeteraiSerial}, 'STAMPED', ${psreProvider}, 'FULLY_SIGNED',
        ${q.grand_total_gross}, 5.00, NOW()
      )
      RETURNING *
    `;

    const contract = inserted[0];
    const nextDealStage = q.pipeline_mode === 'MPC_PROPERTI' ? 'PPJB_KPR' : 'SPK_KONTRAK';
    await sql`UPDATE crm_deals SET stage = ${nextDealStage}, win_probability = 95 WHERE id = ${q.deal_id}`;

    // Auto-generate 20% Down Payment Milestone Invoice in SNAP BI + SAP FI
    const billCountRes = await sql`SELECT COUNT(*)::int AS cnt FROM crm_billings`;
    const billNum = Number(billCountRes[0].cnt || 0) + 1;
    const invNo = `INV/MPC-FIN/2026/${String(billNum).padStart(3, '0')}`;
    const dpDpp = Math.round(Number(q.net_dpp) * 0.2);
    const dpPpn = Math.round(Number(q.ppn_amount) * 0.2);
    const dpPph = Math.round(Number(q.pph_amount) * 0.2);
    const dpGross = dpDpp + dpPpn;
    const snapVa = `8890800${q.deal_id}2026${String(billNum).padStart(4, '0')}`;
    const sapRef = `SAP-FI-1900${3300 + billNum}`;

    await sql`
      INSERT INTO crm_billings (
        invoice_number, contract_id, deal_id, term_name, progress_trigger_pct,
        dpp_amount, ppn_amount, pph_withheld, total_invoice,
        snap_va_number, due_date, payment_status, erp_sync_ref
      ) VALUES (
        ${invNo}, ${contract.id}, ${q.deal_id}, 'Uang Muka Kontrak (Down Payment 20%)', 0,
        ${dpDpp}, ${dpPpn}, ${dpPph}, ${dpGross},
        ${snapVa}, CURRENT_DATE + INTERVAL '14 days', 'ISSUED', ${sapRef}
      )
    `;

    await writeAuditLog({
      actorName: actor.actorName,
      actorRole: actor.role,
      actionType: 'CONTRACT_STAMPED_PSRE',
      moduleName: 'DIGITAL_CONTRACT',
      entityRef: contractNumber,
      changeSummary: `Penerbitan kontrak digital ${contractNumber} + e-Meterai ${emeteraiSerial} (${psreProvider}) & tagihan DP otomatis ${invNo}.`,
      oldValue: q.quote_number,
      newValue: `${contractNumber} | FULLY_SIGNED`,
    });

    return NextResponse.json({ contract }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Gagal menerbitkan kontrak' },
      { status: 500 }
    );
  }
}
