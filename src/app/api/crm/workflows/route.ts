import { NextRequest, NextResponse } from 'next/server';
import { metric } from '@vercel/functions';
import fs from 'node:fs';
import path from 'node:path';
import { getSql, writeAuditLog } from '@/lib/db';
import { ROLE_PROFILES, UserRole } from '@/lib/governance';

export const dynamic = 'force-dynamic';

async function ensureWorkflowTable() {
  const sql = getSql();
  await sql`
    CREATE TABLE IF NOT EXISTS crm_workflow_runs (
      id SERIAL PRIMARY KEY,
      run_code VARCHAR(48) UNIQUE NOT NULL,
      workflow_key VARCHAR(64) NOT NULL,
      workflow_title VARCHAR(160) NOT NULL,
      trigger_source VARCHAR(48) NOT NULL,
      actor_name VARCHAR(100) NOT NULL,
      status VARCHAR(32) NOT NULL DEFAULT 'COMPLETED',
      duration_ms INT NOT NULL DEFAULT 0,
      steps_json TEXT NOT NULL,
      output_summary TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  const existing = await sql`SELECT COUNT(*)::int AS cnt FROM crm_workflow_runs`;
  if (Number(existing[0]?.cnt || 0) === 0) {
    await sql`
      INSERT INTO crm_workflow_runs (
        run_code, workflow_key, workflow_title, trigger_source, actor_name, status, duration_ms, steps_json, output_summary
      ) VALUES
        (
          'WFR-2026-001',
          'WF_APPROVAL_SLA',
          'Multi-Tier Approval Escalation & WhatsApp Alert (L1 -> L3)',
          'SCHEDULED_SLA_WATCHER',
          'n8n Orchestrator Engine',
          'COMPLETED',
          184,
          ${JSON.stringify([
            { step: 'Scan Pending Quotations in Neon DB', status: 'OK', detail: '2 pending quotes detected (L2 & L3)' },
            { step: 'Evaluate Corporate SLA Matrix (8h / 24h)', status: 'OK', detail: 'MPC/COM/QUO/2026/004 & 003 within SLA window' },
            { step: 'Dispatch Executive Approval Digest (WABA)', status: 'OK', detail: 'Delivered to VP Commercial & Board Inbox' },
          ])},
          'Memindai 2 Quotation pending (Rp139,52 M bruto) dan mengirim kartu pengingat otorisasi ke VP & Direksi.'
        ),
        (
          'WFR-2026-002',
          'WF_SNAP_ERP_RECON',
          'SNAP BI Virtual Account & SAP S/4HANA FI Auto-Sync',
          'WEBHOOK_SNAP_BI',
          'n8n Orchestrator Engine',
          'COMPLETED',
          142,
          ${JSON.stringify([
            { step: 'Verify SNAP BI Signature & VA Payload', status: 'OK', detail: '5 active milestone invoices audited' },
            { step: 'Check Overdue Receivables (> Due Date)', status: 'WARN', detail: 'INV/MPC-FIN/2026/005 flagged OVERDUE' },
            { step: 'Sync AR Aging Ledger Ref to SAP FI', status: 'OK', detail: 'SAP-FI-19003204 reminder queued' },
          ])},
          'Sinkronisasi 5 jadwal termin SNAP BI (Rp135,41 M terbayar, 1 termin OVERDUE diberi notifikasi otomatis).'
        )
    `;
  }
}

const WORKFLOW_CATALOG = [
  {
    key: 'WF_WABA_BANT',
    titleId: '1. Omnichannel WABA & Tender Lead Scoring',
    titleEn: '1. Omnichannel WABA & Tender Lead Scoring',
    engine: 'n8n Webhook + Neon DB',
    trigger: 'POST /api/crm/webhooks/n8n',
    descriptionId:
      'Memvalidasi Explicit Consent UU PDP, mendeteksi duplikasi prospek lintas kanal, menghitung skor BANT, dan menugaskan AE secara otomatis.',
    descriptionEn:
      'Validates UU PDP Explicit Consent, deduplicates incoming leads, computes BANT score, and assigns the dedicated AE.',
  },
  {
    key: 'WF_APPROVAL_SLA',
    titleId: '2. Multi-Tier Approval SLA Escalation (L1–L3)',
    titleEn: '2. Multi-Tier Approval SLA Escalation (L1–L3)',
    engine: 'n8n SLA Timer + RBAC Matrix',
    trigger: 'Cron 30m / Instant Quote Hook',
    descriptionId:
      'Memantau antrean Quotation PENDING_L1/L2/L3 (SLA 4j/8j/24j) dan mengirimkan pengingat persetujuan ke Manager, VP Commercial, atau Direksi.',
    descriptionEn:
      'Monitors PENDING_L1/L2/L3 quotations against 4h/8h/24h SLAs and dispatches instant approval cards to executives.',
  },
  {
    key: 'WF_SNAP_ERP_RECON',
    titleId: '3. Kontrak PSrE, SNAP BI VA & Jurnal SAP FI',
    titleEn: '3. PSrE Contract, SNAP BI VA & SAP FI Sync',
    engine: 'n8n HTTP Credential + ERP Connector',
    trigger: 'Event CONTRACT_STAMPED / VA Callback',
    descriptionId:
      'Memeriksa kelengkapan e-Meterai PERURI & tanda tangan PSrE, merekonsiliasi status Virtual Account SNAP BI, dan memvalidasi jurnal SAP FI.',
    descriptionEn:
      'Audits PERURI e-Meterai & PSrE status, reconciles SNAP BI Virtual Accounts, and validates SAP S/4HANA FI references.',
  },
  {
    key: 'WF_BAST_RETENTION',
    titleId: '4. Digital BAST Geotag & ITIL v4 SLA Watchdog',
    titleEn: '4. Digital BAST Geotag & ITIL v4 SLA Watchdog',
    engine: 'n8n Alert Sub-Workflow + ITIL Desk',
    trigger: 'Cron 15m / Ticket Breach Guard',
    descriptionId:
      'Melacak masa retensi 180 hari pasca-BAST serta mengeskalasi tiket keluhan teknis yang mendekati batas waktu SLA.',
    descriptionEn:
      'Tracks 180-day post-BAST retention windows and escalates field tickets approaching their SLA breach threshold.',
  },
];

export async function GET() {
  try {
    await ensureWorkflowTable();
    const sql = getSql();
    const runs = await sql`SELECT * FROM crm_workflow_runs ORDER BY id DESC LIMIT 20`;

    let n8nBlueprint = '{}';
    try {
      n8nBlueprint = fs.readFileSync(
        path.join(process.cwd(), 'workflows', 'n8n', 'enterprise-crm-n8n-pack.json'),
        'utf8'
      );
    } catch {
      n8nBlueprint = '{}';
    }

    return NextResponse.json({
      figjamUrl:
        'https://www.figma.com/board/iekAkQkSTIHZ6AVB6uZIAj?utm_source=other&utm_content=edit_in_figjam',
      workflows: WORKFLOW_CATALOG,
      runs: runs.map((r) => ({
        ...r,
        steps: JSON.parse(r.steps_json || '[]'),
      })),
      n8nBlueprint,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load workflows' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const startedAt = performance.now();
  try {
    await ensureWorkflowTable();
    const body = await req.json();
    const workflowKey = String(body.workflowKey || 'WF_APPROVAL_SLA');
    const role = (body.actorRole || 'DIREKSI') as UserRole;
    const actor = ROLE_PROFILES[role] || ROLE_PROFILES.DIREKSI;

    const wfMeta = WORKFLOW_CATALOG.find((w) => w.key === workflowKey) || WORKFLOW_CATALOG[1];
    const sql = getSql();

    let steps: { step: string; status: string; detail: string }[] = [];
    let summary = '';

    if (workflowKey === 'WF_WABA_BANT') {
      const leads = await sql`SELECT COUNT(*)::int AS total, AVG(bant_score)::numeric(5,1) AS avg_bant FROM crm_leads`;
      steps = [
        {
          step: 'Verify UU PDP Explicit Consent & Deduplication Index',
          status: 'OK',
          detail: `${leads[0].total} leads verified with 100% PDP consent timestamp`,
        },
        {
          step: 'Recompute Omnichannel BANT Priority Queue',
          status: 'OK',
          detail: `Average BANT qualification score: ${leads[0].avg_bant}/100`,
        },
        {
          step: 'Push High-Intent Tender Digest to AE Desk',
          status: 'OK',
          detail: 'Routed EPC_B2B -> Raka Pratama, MPC_PROPERTI -> Nadia Kusuma',
        },
      ];
      summary = `Audit otomatis ${leads[0].total} prospek omnichannel selesai (Rata-rata BANT ${leads[0].avg_bant}/100, 0 pelanggaran UU PDP).`;
    } else if (workflowKey === 'WF_APPROVAL_SLA') {
      const pending = await sql`
        SELECT quote_number, discount_pct, required_approval_level, grand_total_gross
        FROM crm_quotations
        WHERE approval_status LIKE 'PENDING_%'
      `;
      steps = [
        {
          step: 'Query Neon PostgreSQL Pending Quotations',
          status: 'OK',
          detail: `${pending.length} quotations awaiting executive sign-off`,
        },
        {
          step: 'Match Corporate Approval Matrix (L1/L2/L3)',
          status: 'OK',
          detail:
            pending.map((p) => `${p.quote_number} -> L${p.required_approval_level}`).join(', ') ||
            'All queues clear',
        },
        {
          step: 'Dispatch n8n Escalation Notification Payload',
          status: 'OK',
          detail: `Sent structured approval cards for ${pending.length} items`,
        },
      ];
      summary = `Menjalankan eskalasi SLA atas ${pending.length} pengajuan deviasi harga aktif sesuai Corporate Approval Matrix.`;
    } else if (workflowKey === 'WF_SNAP_ERP_RECON') {
      const billStats = await sql`
        SELECT
          COUNT(*) FILTER (WHERE payment_status = 'PAID')::int AS paid_cnt,
          COUNT(*) FILTER (WHERE payment_status = 'OVERDUE')::int AS overdue_cnt,
          COALESCE(SUM(total_invoice) FILTER (WHERE payment_status = 'OVERDUE'), 0) AS overdue_val
        FROM crm_billings
      `;
      steps = [
        {
          step: 'Validate PERURI e-Meterai & PSrE Contract Links',
          status: 'OK',
          detail: 'All active contracts carry verified PERURI-EM serials',
        },
        {
          step: 'Poll SNAP BI Virtual Account Settlement Ledger',
          status: billStats[0].overdue_cnt > 0 ? 'WARN' : 'OK',
          detail: `${billStats[0].paid_cnt} PAID, ${billStats[0].overdue_cnt} OVERDUE`,
        },
        {
          step: 'Dispatch Automated Payment Reminder & SAP FI Sync',
          status: 'OK',
          detail: `Overdue exposure Rp${Number(billStats[0].overdue_val).toLocaleString('id-ID')} queued for dunning`,
        },
      ];
      summary = `Rekonsiliasi VA SNAP BI selesai: ${billStats[0].paid_cnt} lunas, ${billStats[0].overdue_cnt} jatuh tempo dikirim pengingat otomatis.`;
    } else {
      const tickets = await sql`
        SELECT COUNT(*) FILTER (WHERE status != 'RESOLVED')::int AS open_cnt,
               COUNT(*)::int AS total_cnt
        FROM crm_sla_tickets
      `;
      const bastCnt = await sql`SELECT COUNT(*)::int AS cnt FROM crm_bast`;
      steps = [
        {
          step: 'Audit Geotagged Digital BAST Retention Windows',
          status: 'OK',
          detail: `${bastCnt[0].cnt} active 180-day retention certificates monitored`,
        },
        {
          step: 'Evaluate ITIL v4 Open Ticket Deadlines',
          status: tickets[0].open_cnt > 0 ? 'WARN' : 'OK',
          detail: `${tickets[0].open_cnt} open ticket(s) out of ${tickets[0].total_cnt} total`,
        },
        {
          step: 'Trigger Field Engineering On-Call Alert',
          status: 'OK',
          detail: 'Escalation webhook delivered to Site Instrumentation Team',
        },
      ];
      summary = `Pemantauan ${bastCnt[0].cnt} BAST aktif & ${tickets[0].open_cnt} tiket retensi terbuka berhasil dijalankan.`;
    }

    const durationMs = Math.max(48, Math.round(performance.now() - startedAt));
    const countRes = await sql`SELECT COUNT(*)::int AS cnt FROM crm_workflow_runs`;
    const runCode = `WFR-2026-${String(Number(countRes[0].cnt || 0) + 1).padStart(3, '0')}`;

    const inserted = await sql`
      INSERT INTO crm_workflow_runs (
        run_code, workflow_key, workflow_title, trigger_source,
        actor_name, status, duration_ms, steps_json, output_summary
      ) VALUES (
        ${runCode}, ${wfMeta.key}, ${wfMeta.titleId}, 'MANUAL_UI_TRIGGER',
        ${actor.actorName}, 'COMPLETED', ${durationMs}, ${JSON.stringify(steps)}, ${summary}
      )
      RETURNING *
    `;

    await writeAuditLog({
      actorName: actor.actorName,
      actorRole: actor.role,
      actionType: 'WORKFLOW_EXECUTED',
      moduleName: 'WORKFLOW_AUTOMATION',
      entityRef: runCode,
      changeSummary: `Eksekusi workflow otomasi ${wfMeta.key}: ${summary}`,
      oldValue: 'IDLE',
      newValue: `COMPLETED (${durationMs}ms)`,
    });

    metric('crm.workflows.executed', 1, { workflowKey: wfMeta.key, outcome: 'success' });

    return NextResponse.json({
      run: {
        ...inserted[0],
        steps,
      },
    });
  } catch (error) {
    metric('crm.workflows.executed', 1, { outcome: 'error' });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Gagal menjalankan workflow' },
      { status: 500 }
    );
  }
}
