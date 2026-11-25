import { NextRequest, NextResponse } from 'next/server';
import { metric } from '@vercel/functions';
import { getSql, isDatabaseConfigured } from '@/lib/db';
import { maskSensitiveIdentity, ROLE_PROFILES, UserRole } from '@/lib/governance';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const startedAt = performance.now();
  const roleParam = (req.nextUrl.searchParams.get('role') || 'DIREKSI') as UserRole;
  const activeRole = ROLE_PROFILES[roleParam] || ROLE_PROFILES.DIREKSI;

  if (!isDatabaseConfigured()) {
    return NextResponse.json({
      configured: false,
      activeRole,
      message: 'DATABASE_URL belum dikonfigurasi pada environment variables.',
    });
  }

  try {
    const sql = getSql();

    const [
      leads,
      rawAccounts,
      deals,
      quotations,
      contracts,
      billings,
      bastRecords,
      slaTickets,
      auditLogs,
    ] = await Promise.all([
      sql`SELECT * FROM crm_leads ORDER BY id DESC`,
      sql`SELECT * FROM crm_accounts ORDER BY id DESC`,
      sql`
        SELECT d.*, a.entity_name AS account_name, a.account_code, a.kyc_status
        FROM crm_deals d
        LEFT JOIN crm_accounts a ON a.id = d.account_id
        ORDER BY d.id DESC
      `,
      sql`
        SELECT q.*, d.project_name, d.deal_code, d.pipeline_mode
        FROM crm_quotations q
        LEFT JOIN crm_deals d ON d.id = q.deal_id
        ORDER BY q.id DESC
      `,
      sql`
        SELECT c.*, d.project_name, d.deal_code, a.entity_name AS account_name
        FROM crm_contracts c
        LEFT JOIN crm_deals d ON d.id = c.deal_id
        LEFT JOIN crm_accounts a ON a.id = d.account_id
        ORDER BY c.id DESC
      `,
      sql`
        SELECT b.*, d.project_name, d.deal_code, c.contract_number
        FROM crm_billings b
        LEFT JOIN crm_deals d ON d.id = b.deal_id
        LEFT JOIN crm_contracts c ON c.id = b.contract_id
        ORDER BY b.due_date ASC, b.id DESC
      `,
      sql`
        SELECT r.*, d.project_name, d.deal_code, d.location_city
        FROM crm_bast r
        LEFT JOIN crm_deals d ON d.id = r.deal_id
        ORDER BY r.id DESC
      `,
      sql`
        SELECT t.*, d.project_name, d.deal_code
        FROM crm_sla_tickets t
        LEFT JOIN crm_deals d ON d.id = t.deal_id
        ORDER BY
          CASE WHEN t.status = 'RESOLVED' THEN 1 ELSE 0 END ASC,
          t.sla_deadline ASC
      `,
      sql`SELECT * FROM crm_audit_logs ORDER BY id DESC LIMIT 60`,
    ]);

    const accounts = rawAccounts.map((acc) => ({
      ...acc,
      nik_display: maskSensitiveIdentity(acc.nik_16, activeRole.canViewUnmaskedKyc),
      npwp_display: maskSensitiveIdentity(acc.npwp_16, activeRole.canViewUnmaskedKyc),
      nitku_display: maskSensitiveIdentity(acc.nitku_22, activeRole.canViewUnmaskedKyc),
      nik_16: activeRole.canViewUnmaskedKyc ? acc.nik_16 : undefined,
      npwp_16: activeRole.canViewUnmaskedKyc ? acc.npwp_16 : undefined,
      nitku_22: activeRole.canViewUnmaskedKyc ? acc.nitku_22 : undefined,
    }));

    const totalPipelineValue = deals.reduce((sum, d) => sum + Number(d.estimated_value || 0), 0);
    const weightedForecastValue = deals.reduce(
      (sum, d) => sum + Number(d.estimated_value || 0) * (Number(d.win_probability || 0) / 100),
      0
    );
    const contractedValue = contracts.reduce((sum, c) => sum + Number(c.contract_value || 0), 0);
    const paidCashIn = billings
      .filter((b) => b.payment_status === 'PAID')
      .reduce((sum, b) => sum + Number(b.total_invoice || 0), 0);
    const outstandingReceivables = billings
      .filter((b) => b.payment_status === 'ISSUED' || b.payment_status === 'OVERDUE')
      .reduce((sum, b) => sum + Number(b.total_invoice || 0), 0);
    const pendingApprovalsCount = quotations.filter((q) =>
      String(q.approval_status).startsWith('PENDING_')
    ).length;
    const openSlaTicketsCount = slaTickets.filter((t) => t.status !== 'RESOLVED').length;

    metric('crm.bootstrap.duration_ms', performance.now() - startedAt, { outcome: 'success' });

    return NextResponse.json({
      configured: true,
      activeRole,
      kpis: {
        totalPipelineValue,
        weightedForecastValue,
        contractedValue,
        paidCashIn,
        outstandingReceivables,
        pendingApprovalsCount,
        openSlaTicketsCount,
        totalDeals: deals.length,
        totalLeads: leads.length,
        verifiedAccounts: rawAccounts.filter((a) => a.kyc_status === 'VERIFIED').length,
        totalAccounts: rawAccounts.length,
      },
      leads,
      accounts,
      deals,
      quotations,
      contracts,
      billings,
      bastRecords,
      slaTickets,
      auditLogs,
    });
  } catch (error) {
    metric('crm.bootstrap.duration_ms', performance.now() - startedAt, { outcome: 'error' });
    const message = error instanceof Error ? error.message : 'Database connection error';
    return NextResponse.json({ configured: true, error: message }, { status: 500 });
  }
}
