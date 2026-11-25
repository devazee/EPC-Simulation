import { NextRequest, NextResponse } from 'next/server';
import { getSql, writeAuditLog } from '@/lib/db';
import { ROLE_PROFILES, UserRole } from '@/lib/governance';

const STAGE_PROBABILITY: Record<string, number> = {
  RFQ_TENDER: 25,
  AANWIJZING_SURVEY: 45,
  PROPOSAL_BOQ: 65,
  NEGOSIASI: 80,
  BOOKING_FEE: 75,
  SPK_KONTRAK: 95,
  PPJB_KPR: 92,
  BAST_HANDOVER: 100,
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const role = (body.actorRole || 'SALES_AE') as UserRole;
    const actor = ROLE_PROFILES[role] || ROLE_PROFILES.SALES_AE;

    const projectName = String(body.projectName || '').trim();
    const accountId = Number(body.accountId) || null;
    const pipelineMode = body.pipelineMode === 'MPC_PROPERTI' ? 'MPC_PROPERTI' : 'EPC_B2B';
    const stage = String(body.stage || 'RFQ_TENDER');
    const estimatedValue = Math.max(0, Number(body.estimatedValue) || 0);
    const locationCity = String(body.locationCity || 'Jakarta').trim();
    const provinceRegion = String(body.provinceRegion || 'DKI Jakarta (WIB)').trim();

    if (!projectName || estimatedValue <= 0) {
      return NextResponse.json({ error: 'Nama proyek dan estimasi nilai proyek wajib diisi.' }, { status: 400 });
    }

    const sql = getSql();
    const countRes = await sql`SELECT COUNT(*)::int AS cnt FROM crm_deals`;
    const nextNum = Number(countRes[0].cnt || 0) + 1;
    const prefix = pipelineMode === 'EPC_B2B' ? 'PRJ-EPC-2026' : 'PRJ-MPC-2026';
    const dealCode = `${prefix}-${String(nextNum).padStart(3, '0')}`;
    const winProb = STAGE_PROBABILITY[stage] ?? 50;

    const inserted = await sql`
      INSERT INTO crm_deals (
        deal_code, account_id, project_name, pipeline_mode, stage,
        estimated_value, currency, win_probability, physical_progress,
        pic_ae, project_manager, location_city, province_region
      ) VALUES (
        ${dealCode}, ${accountId}, ${projectName}, ${pipelineMode}, ${stage},
        ${estimatedValue}, 'IDR', ${winProb}, 0,
        ${pipelineMode === 'EPC_B2B' ? 'Raka Pratama' : 'Nadia Kusuma'},
        ${pipelineMode === 'EPC_B2B' ? 'Ir. Dimas Prakoso, PMP' : 'Ir. Ratna Permata, M.Ars'},
        ${locationCity}, ${provinceRegion}
      )
      RETURNING *
    `;

    await writeAuditLog({
      actorName: actor.actorName,
      actorRole: actor.role,
      actionType: 'DEAL_CREATED',
      moduleName: 'PIPELINE_DEALS',
      entityRef: dealCode,
      changeSummary: `Inisiasi peluang proyek baru ${projectName} senilai Rp${estimatedValue.toLocaleString('id-ID')}.`,
      oldValue: null,
      newValue: `${stage} (${winProb}%)`,
    });

    return NextResponse.json({ deal: inserted[0] }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Gagal membuat proyek pipeline' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const role = (body.actorRole || 'SALES_AE') as UserRole;
    const actor = ROLE_PROFILES[role] || ROLE_PROFILES.SALES_AE;
    const dealId = Number(body.dealId);

    const sql = getSql();
    const existing = await sql`SELECT * FROM crm_deals WHERE id = ${dealId}`;
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Proyek tidak ditemukan.' }, { status: 404 });
    }

    const prev = existing[0];
    const nextStage = body.stage ? String(body.stage) : prev.stage;
    const nextProb = body.stage ? (STAGE_PROBABILITY[nextStage] ?? prev.win_probability) : prev.win_probability;
    const nextProgress =
      body.physicalProgress !== undefined
        ? Math.min(100, Math.max(0, Number(body.physicalProgress)))
        : prev.physical_progress;

    await sql`
      UPDATE crm_deals
      SET stage = ${nextStage},
          win_probability = ${nextProb},
          physical_progress = ${nextProgress}
      WHERE id = ${dealId}
    `;

    await writeAuditLog({
      actorName: actor.actorName,
      actorRole: actor.role,
      actionType: 'PIPELINE_UPDATED',
      moduleName: 'PIPELINE_DEALS',
      entityRef: prev.deal_code,
      changeSummary: `Pembaruan status pipeline / progres fisik proyek ${prev.project_name}.`,
      oldValue: `${prev.stage} | Progres ${prev.physical_progress}%`,
      newValue: `${nextStage} | Progres ${nextProgress}%`,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Gagal memperbarui pipeline' },
      { status: 500 }
    );
  }
}
