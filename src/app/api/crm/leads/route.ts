import { NextRequest, NextResponse } from 'next/server';
import { metric } from '@vercel/functions';
import { getSql, writeAuditLog } from '@/lib/db';
import { ROLE_PROFILES, UserRole } from '@/lib/governance';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const role = (body.actorRole || 'SALES_AE') as UserRole;
    const actor = ROLE_PROFILES[role] || ROLE_PROFILES.SALES_AE;

    const fullName = String(body.fullName || '').trim();
    const jobTitle = String(body.jobTitle || 'Procurement Lead').trim();
    const companyName = String(body.companyName || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const phone = String(body.phone || '').trim();
    const channel = String(body.channel || 'WABA').trim();
    const segmentMode = body.segmentMode === 'MPC_PROPERTI' ? 'MPC_PROPERTI' : 'EPC_B2B';
    const estimatedBudget = Math.max(0, Number(body.estimatedBudget) || 0);
    const lastMessage = String(body.lastMessage || '').trim();
    const pdpConsent = Boolean(body.pdpConsent);

    if (!fullName || !companyName || !email || !phone) {
      return NextResponse.json(
        { error: 'Nama lengkap, perusahaan, email, dan nomor telepon wajib diisi.' },
        { status: 400 }
      );
    }

    if (!pdpConsent) {
      return NextResponse.json(
        { error: 'Persetujuan eksplisit UU No. 27 Tahun 2022 (UU PDP) wajib dicentang sebelum menyimpan data pribadi.' },
        { status: 400 }
      );
    }

    const sql = getSql();
    const dup = await sql`
      SELECT lead_code FROM crm_leads
      WHERE LOWER(email) = ${email} OR phone = ${phone}
      LIMIT 1
    `;
    if (dup.length > 0) {
      metric('crm.leads.created', 1, { outcome: 'duplicate', channel });
      return NextResponse.json(
        { error: `Duplikasi prospek terdeteksi dengan kode eksisting ${dup[0].lead_code} (Auto-Deduplication FR-01).` },
        { status: 409 }
      );
    }

    const countRes = await sql`SELECT COUNT(*)::int AS cnt FROM crm_leads`;
    const nextNum = Number(countRes[0].cnt || 0) + 1;
    const leadCode = `LD-2026-${String(nextNum).padStart(3, '0')}`;

    const budgetScore = estimatedBudget >= 50_000_000_000 ? 28 : estimatedBudget >= 15_000_000_000 ? 22 : 16;
    const channelScore = channel === 'LPSE_TENDER' ? 68 : channel === 'WABA' ? 64 : 62;
    const bantScore = Math.min(99, budgetScore + channelScore);
    const assignedAe = segmentMode === 'EPC_B2B' ? 'Raka Pratama' : 'Nadia Kusuma';

    const inserted = await sql`
      INSERT INTO crm_leads (
        lead_code, full_name, job_title, company_name, email, phone,
        channel, segment_mode, estimated_budget, bant_score, assigned_ae,
        pdp_consent, pdp_consent_at, status, last_message
      ) VALUES (
        ${leadCode}, ${fullName}, ${jobTitle}, ${companyName}, ${email}, ${phone},
        ${channel}, ${segmentMode}, ${estimatedBudget}, ${bantScore}, ${assignedAe},
        TRUE, NOW(), 'QUALIFIED', ${lastMessage || 'Prospek baru teregistrasi dengan Explicit Consent UU PDP.'}
      )
      RETURNING *
    `;

    await writeAuditLog({
      actorName: actor.actorName,
      actorRole: actor.role,
      actionType: 'LEAD_CAPTURED',
      moduleName: 'OMNICHANNEL_LEADS',
      entityRef: leadCode,
      changeSummary: `Registrasi prospek ${companyName} (${channel}) dengan persetujuan UU PDP & Skor BANT ${bantScore}.`,
      oldValue: null,
      newValue: `${leadCode} | ${segmentMode} | Rp${estimatedBudget.toLocaleString('id-ID')}`,
    });

    metric('crm.leads.created', 1, { outcome: 'success', channel });
    return NextResponse.json({ lead: inserted[0] }, { status: 201 });
  } catch (error) {
    metric('crm.leads.created', 1, { outcome: 'error' });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Gagal menyimpan prospek' },
      { status: 500 }
    );
  }
}
