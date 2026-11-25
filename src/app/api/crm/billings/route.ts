import { NextRequest, NextResponse } from 'next/server';
import { getSql, writeAuditLog } from '@/lib/db';
import { ROLE_PROFILES, UserRole } from '@/lib/governance';

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const role = (body.actorRole || 'LEGAL_FINANCE') as UserRole;
    const actor = ROLE_PROFILES[role] || ROLE_PROFILES.LEGAL_FINANCE;

    if (!actor.canReconcileBilling) {
      return NextResponse.json(
        { error: 'Akses Ditolak (RBAC): Rekonsiliasi pembayaran Virtual Account SNAP BI hanya diizinkan bagi peran LEGAL_FINANCE.' },
        { status: 403 }
      );
    }

    const billingId = Number(body.billingId);
    const sql = getSql();
    const existing = await sql`SELECT * FROM crm_billings WHERE id = ${billingId}`;
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Invoice termin tidak ditemukan.' }, { status: 404 });
    }

    const inv = existing[0];
    await sql`
      UPDATE crm_billings
      SET payment_status = 'PAID', paid_at = NOW()
      WHERE id = ${billingId}
    `;

    await writeAuditLog({
      actorName: actor.actorName,
      actorRole: actor.role,
      actionType: 'BILLING_RECONCILED_PAID',
      moduleName: 'MILESTONE_BILLING',
      entityRef: inv.invoice_number,
      changeSummary: `Rekonsiliasi pelunasan Virtual Account SNAP BI (${inv.snap_va_number}) untuk ${inv.term_name}.`,
      oldValue: inv.payment_status,
      newValue: 'PAID',
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Gagal merekonsiliasi pembayaran' },
      { status: 500 }
    );
  }
}
