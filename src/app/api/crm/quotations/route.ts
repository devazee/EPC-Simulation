import { NextRequest, NextResponse } from 'next/server';
import { metric } from '@vercel/functions';
import { getSql, writeAuditLog } from '@/lib/db';
import {
  calculateQuotationAndApproval,
  PphScheme,
  ROLE_PROFILES,
  UserRole,
} from '@/lib/governance';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const role = (body.actorRole || 'SALES_AE') as UserRole;
    const actor = ROLE_PROFILES[role] || ROLE_PROFILES.SALES_AE;

    const dealId = Number(body.dealId);
    const boqSummary = String(body.boqSummary || '').trim();
    const subtotalDpp = Number(body.subtotalDpp);
    const discountPct = Number(body.discountPct || 0);
    const ppnRate = Number(body.ppnRate || 11);
    const pphScheme = (body.pphScheme || 'PPH_FINAL_EPC_265') as PphScheme;
    const termDeviationDays = Number(body.termDeviationDays || 0);
    const approvalNotes = String(body.approvalNotes || '').trim();

    if (!dealId || !boqSummary || subtotalDpp <= 0) {
      return NextResponse.json(
        { error: 'Pilih proyek, isi ringkasan BoQ/penawaran, dan masukkan nilai DPP yang valid.' },
        { status: 400 }
      );
    }

    const calc = calculateQuotationAndApproval({
      subtotalDpp,
      discountPct,
      ppnRate,
      pphScheme,
      termDeviationDays,
    });

    const sql = getSql();
    const countRes = await sql`SELECT COUNT(*)::int AS cnt FROM crm_quotations`;
    const nextNum = Number(countRes[0].cnt || 0) + 1;
    const quoteNumber = `MPC/COM/QUO/2026/${String(nextNum).padStart(3, '0')}`;

    const isAuto = calc.requiredLevel === 0;

    const inserted = await sql`
      INSERT INTO crm_quotations (
        quote_number, deal_id, boq_summary,
        subtotal_dpp, discount_pct, discount_amount, net_dpp,
        ppn_rate, ppn_amount, pph_scheme, pph_rate, pph_amount,
        grand_total_gross, net_cash_receivable, term_deviation_days,
        required_approval_level, approval_status,
        requested_by, approved_by, approval_notes, sla_hours, decided_at
      ) VALUES (
        ${quoteNumber}, ${dealId}, ${boqSummary},
        ${calc.subtotalDpp}, ${calc.discountPct}, ${calc.discountAmount}, ${calc.netDpp},
        ${calc.ppnRate}, ${calc.ppnAmount}, ${calc.pphScheme}, ${calc.pphRate}, ${calc.pphAmount},
        ${calc.grandTotalGross}, ${calc.netCashReceivable}, ${calc.termDeviationDays},
        ${calc.requiredLevel}, ${isAuto ? 'APPROVED' : calc.approvalStatus},
        ${actor.actorName}, ${isAuto ? 'SISTEM OTOMATIS (Level 0)' : null},
        ${approvalNotes || (isAuto ? 'Sesuai pricelist baku tanpa deviasi.' : `Menunggu persetujuan Level ${calc.requiredLevel} (SLA ${calc.slaHours} jam kerja).`)},
        ${calc.slaHours}, ${isAuto ? new Date().toISOString() : null}
      )
      RETURNING *
    `;

    await writeAuditLog({
      actorName: actor.actorName,
      actorRole: actor.role,
      actionType: isAuto ? 'QUOTE_AUTO_APPROVED' : `QUOTE_SUBMITTED_L${calc.requiredLevel}`,
      moduleName: 'QUOTATIONS_CPQ',
      entityRef: quoteNumber,
      changeSummary: `Pembuatan Quotation ${quoteNumber} (Diskon ${calc.discountPct}%, PPN ${calc.ppnRate}%, PPh ${calc.pphRate}%) -> Status ${isAuto ? 'APPROVED' : calc.approvalStatus}.`,
      oldValue: null,
      newValue: `Gross Rp${calc.grandTotalGross.toLocaleString('id-ID')} | Level ${calc.requiredLevel}`,
    });

    metric('crm.quotations.created', 1, {
      outcome: 'success',
      level: `L${calc.requiredLevel}`,
    });

    return NextResponse.json({ quotation: inserted[0] }, { status: 201 });
  } catch (error) {
    metric('crm.quotations.created', 1, { outcome: 'error' });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Gagal membuat Quotation' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const role = (body.actorRole || 'SALES_AE') as UserRole;
    const actor = ROLE_PROFILES[role] || ROLE_PROFILES.SALES_AE;
    const quoteId = Number(body.quoteId);
    const decision = body.decision === 'REJECTED' ? 'REJECTED' : 'APPROVED';
    const notes = String(body.notes || '').trim();

    const sql = getSql();
    const existing = await sql`SELECT * FROM crm_quotations WHERE id = ${quoteId}`;
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Quotation tidak ditemukan.' }, { status: 404 });
    }

    const quote = existing[0];
    const reqLevel = Number(quote.required_approval_level || 1);

    if (actor.approvalMaxLevel < reqLevel) {
      metric('crm.approvals.decided', 1, { outcome: 'forbidden' });
      return NextResponse.json(
        {
          error: `Otorisasi Ditolak (Corporate Approval Matrix): Pengajuan ini membutuhkan minimal persetujuan Level ${reqLevel} (${
            reqLevel === 3 ? 'Direksi' : reqLevel === 2 ? 'VP Commercial / GM' : 'Manager'
          }), sedangkan peran Anda saat ini adalah ${actor.labelId}.`,
        },
        { status: 403 }
      );
    }

    await sql`
      UPDATE crm_quotations
      SET approval_status = ${decision},
          approved_by = ${actor.actorName},
          approval_notes = ${notes || `Diputuskan (${decision}) oleh ${actor.actorName}.`},
          decided_at = NOW()
      WHERE id = ${quoteId}
    `;

    await writeAuditLog({
      actorName: actor.actorName,
      actorRole: actor.role,
      actionType: decision === 'APPROVED' ? `TIER${reqLevel}_APPROVED` : `TIER${reqLevel}_REJECTED`,
      moduleName: 'QUOTATIONS_CPQ',
      entityRef: quote.quote_number,
      changeSummary: `Keputusan ${decision} atas ${quote.quote_number} (Diskon ${quote.discount_pct}%).`,
      oldValue: quote.approval_status,
      newValue: decision,
    });

    metric('crm.approvals.decided', 1, { outcome: 'success', decision });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Gagal memproses persetujuan' },
      { status: 500 }
    );
  }
}
