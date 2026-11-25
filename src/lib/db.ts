import { neon } from '@neondatabase/serverless';
import crypto from 'node:crypto';

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim().length > 0);
}

export function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL environment variable is not configured.');
  }
  return neon(url);
}

export async function writeAuditLog(entry: {
  actorName: string;
  actorRole: string;
  actionType: string;
  moduleName: string;
  entityRef: string;
  changeSummary: string;
  oldValue?: string | null;
  newValue?: string | null;
  ipAddress?: string;
}) {
  const sql = getSql();
  const payload = `${entry.actorRole}|${entry.actionType}|${entry.entityRef}|${Date.now()}`;
  const hash = 'sha256:' + crypto.createHash('sha256').update(payload).digest('hex').slice(0, 16);

  await sql`
    INSERT INTO crm_audit_logs (
      log_hash,
      actor_name,
      actor_role,
      action_type,
      module_name,
      entity_ref,
      change_summary,
      old_value,
      new_value,
      ip_address
    ) VALUES (
      ${hash},
      ${entry.actorName},
      ${entry.actorRole},
      ${entry.actionType},
      ${entry.moduleName},
      ${entry.entityRef},
      ${entry.changeSummary},
      ${entry.oldValue ?? null},
      ${entry.newValue ?? null},
      ${entry.ipAddress ?? '103.144.18.42'}
    )
  `;
}
