import { NextRequest, NextResponse } from 'next/server';
import { metric } from '@vercel/functions';
import { getSql, writeAuditLog } from '@/lib/db';
import { ROLE_PROFILES, UserRole } from '@/lib/governance';

const PRIORITY_SLA_HOURS: Record<string, number> = {
  CRITICAL: 4,
  HIGH: 8,
  MEDIUM: 16,
  LOW: 24,
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const role = (body.actorRole || 'HELPDESK') as UserRole;
    const actor = ROLE_PROFILES[role] || ROLE_PROFILES.HELPDESK;

    const dealId = Number(body.dealId);
    const reporterName = String(body.reporterName || '').trim();
    const category = String(body.category || 'MEP_ELECTRICAL');
    const priority = String(body.priority || 'HIGH');
    const subject = String(body.subject || '').trim();
    const assignedTeam = String(body.assignedTeam || 'Tim Teknis Retensi EPC').trim();

    if (!dealId || !reporterName || !subject) {
      return NextResponse.json({ error: 'Proyek, nama pelapor, dan deskripsi keluhan wajib diisi.' }, { status: 400 });
    }

    const slaHours = PRIORITY_SLA_HOURS[priority] ?? 8;
    const deadline = new Date(Date.now() + slaHours * 3600 * 1000).toISOString();

    const sql = getSql();
    const countRes = await sql`SELECT COUNT(*)::int AS cnt FROM crm_sla_tickets`;
    const nextNum = Number(countRes[0].cnt || 0) + 1;
    const ticketNumber = `TCK-SLA-2026-${String(nextNum).padStart(3, '0')}`;

    const inserted = await sql`
      INSERT INTO crm_sla_tickets (
        ticket_number, deal_id, reporter_name, category, priority,
        subject, assigned_team, sla_target_hours, sla_deadline, status
      ) VALUES (
        ${ticketNumber}, ${dealId}, ${reporterName}, ${category}, ${priority},
        ${subject}, ${assignedTeam}, ${slaHours}, ${deadline}, 'OPEN'
      )
      RETURNING *
    `;

    await writeAuditLog({
      actorName: actor.actorName,
      actorRole: actor.role,
      actionType: 'SLA_TICKET_OPENED',
      moduleName: 'HELPDESK_ITIL',
      entityRef: ticketNumber,
      changeSummary: `Tiket komplain masa retensi ${ticketNumber} dibuka (Prioritas ${priority}, Target SLA ${slaHours} jam).`,
      oldValue: null,
      newValue: `OPEN | ${subject}`,
    });

    metric('crm.tickets.created', 1, { priority });
    return NextResponse.json({ ticket: inserted[0] }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Gagal membuat tiket SLA' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const role = (body.actorRole || 'HELPDESK') as UserRole;
    const actor = ROLE_PROFILES[role] || ROLE_PROFILES.HELPDESK;

    if (!actor.canManageSla) {
      return NextResponse.json(
        { error: 'Akses Ditolak (RBAC): Penyelesaian tiket masa retensi hanya diizinkan untuk Helpdesk atau Project Manager.' },
        { status: 403 }
      );
    }

    const ticketId = Number(body.ticketId);
    const resolutionNotes = String(body.resolutionNotes || 'Perbaikan lapangan telah diselesaikan dan diverifikasi bersama klien.').trim();
    const sql = getSql();

    const existing = await sql`SELECT * FROM crm_sla_tickets WHERE id = ${ticketId}`;
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Tiket tidak ditemukan.' }, { status: 404 });
    }

    await sql`
      UPDATE crm_sla_tickets
      SET status = 'RESOLVED',
          resolution_notes = ${resolutionNotes},
          resolved_at = NOW()
      WHERE id = ${ticketId}
    `;

    await writeAuditLog({
      actorName: actor.actorName,
      actorRole: actor.role,
      actionType: 'SLA_TICKET_RESOLVED',
      moduleName: 'HELPDESK_ITIL',
      entityRef: existing[0].ticket_number,
      changeSummary: `Penutupan tiket retensi ${existing[0].ticket_number}: ${resolutionNotes}`,
      oldValue: existing[0].status,
      newValue: 'RESOLVED',
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Gagal memperbarui tiket SLA' },
      { status: 500 }
    );
  }
}
