import { NextRequest, NextResponse } from 'next/server';
import { metric } from '@vercel/functions';
import { getSql, writeAuditLog } from '@/lib/db';
import { ROLE_PROFILES, UserRole } from '@/lib/governance';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const role = (body.actorRole || 'PROJECT_MANAGER') as UserRole;
    const actor = ROLE_PROFILES[role] || ROLE_PROFILES.PROJECT_MANAGER;

    if (!actor.canIssueBast) {
      return NextResponse.json(
        { error: 'Akses Ditolak (RBAC): Penerbitan BAST Digital hanya dapat dilakukan oleh Project Manager atau Direksi.' },
        { status: 403 }
      );
    }

    const dealId = Number(body.dealId);
    const clientRepName = String(body.clientRepName || '').trim();
    const checklistPassed = Math.min(25, Math.max(1, Number(body.checklistPassed || 25)));
    const geotagCoords = String(body.geotagCoords || '-6.2250, 106.8097 (Jakarta)').trim();
    const retentionDays = Number(body.retentionDays || 180);
    const defectNotes = String(body.defectNotes || 'Seluruh parameter komisioning teknis dan mutu fisik lulus inspeksi bersama.').trim();

    if (!dealId || !clientRepName) {
      return NextResponse.json({ error: 'Pilih proyek dan masukkan nama perwakilan klien penandatangan BAST.' }, { status: 400 });
    }

    const sql = getSql();
    const countRes = await sql`SELECT COUNT(*)::int AS cnt FROM crm_bast`;
    const nextNum = Number(countRes[0].cnt || 0) + 1;
    const bastNumber = `MPC/PMO/BAST/2026/${String(nextNum).padStart(3, '0')}`;

    const retentionEnd = new Date();
    retentionEnd.setDate(retentionEnd.getDate() + retentionDays);
    const retentionEndStr = retentionEnd.toISOString().slice(0, 10);

    const inserted = await sql`
      INSERT INTO crm_bast (
        bast_number, deal_id, inspector_name, client_rep_name,
        checklist_passed, checklist_total, geotag_coords, defect_notes,
        handover_date, retention_days, retention_end_date, psre_signed, status
      ) VALUES (
        ${bastNumber}, ${dealId}, ${actor.actorName}, ${clientRepName},
        ${checklistPassed}, 25, ${geotagCoords}, ${defectNotes},
        CURRENT_DATE, ${retentionDays}, ${retentionEndStr}, TRUE, 'SIGNED_ACTIVE_RETENTION'
      )
      RETURNING *
    `;

    await sql`
      UPDATE crm_deals
      SET stage = 'BAST_HANDOVER', physical_progress = 100, win_probability = 100
      WHERE id = ${dealId}
    `;

    await writeAuditLog({
      actorName: actor.actorName,
      actorRole: actor.role,
      actionType: 'BAST_ISSUED',
      moduleName: 'DIGITAL_BAST',
      entityRef: bastNumber,
      changeSummary: `Penerbitan BAST Digital ${bastNumber} (Checklist ${checklistPassed}/25, Geotag ${geotagCoords}) dengan masa retensi ${retentionDays} hari.`,
      oldValue: 'IN_EXECUTION',
      newValue: `SIGNED_ACTIVE_RETENTION (s.d. ${retentionEndStr})`,
    });

    metric('crm.bast.issued', 1, { outcome: 'success' });
    return NextResponse.json({ bast: inserted[0] }, { status: 201 });
  } catch (error) {
    metric('crm.bast.issued', 1, { outcome: 'error' });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Gagal menerbitkan BAST Digital' },
      { status: 500 }
    );
  }
}
