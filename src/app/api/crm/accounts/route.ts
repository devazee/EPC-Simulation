import { NextRequest, NextResponse } from 'next/server';
import { getSql, writeAuditLog } from '@/lib/db';
import { ROLE_PROFILES, UserRole } from '@/lib/governance';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const role = (body.actorRole || 'SALES_AE') as UserRole;
    const actor = ROLE_PROFILES[role] || ROLE_PROFILES.SALES_AE;

    const entityName = String(body.entityName || '').trim();
    const accountType = String(body.accountType || 'SWASTA_TBK').trim();
    const industrySector = String(body.industrySector || 'Infrastruktur & Konstruksi').trim();
    const picName = String(body.picName || '').trim();
    const picRole = String(body.picRole || 'Direktur').trim();
    const picEmail = String(body.picEmail || '').trim();
    const picPhone = String(body.picPhone || '').trim();
    const nik16 = String(body.nik16 || '').replace(/\D/g, '');
    const npwp16 = String(body.npwp16 || '').replace(/\D/g, '');
    const nib13 = String(body.nib13 || '').replace(/\D/g, '');
    const cityProvince = String(body.cityProvince || 'Jakarta Selatan, DKI Jakarta (WIB)').trim();
    const pdpConsent = Boolean(body.pdpConsent);

    if (!entityName || !picName || !picEmail) {
      return NextResponse.json({ error: 'Nama entitas, PIC, dan email wajib diisi.' }, { status: 400 });
    }
    if (nik16.length !== 16 || npwp16.length !== 16 || nib13.length !== 13) {
      return NextResponse.json(
        { error: 'Validasi KYC Gagal: NIK wajib 16 digit, NPWP Coretax wajib 16 digit, dan NIB OSS wajib 13 digit.' },
        { status: 400 }
      );
    }
    if (!pdpConsent) {
      return NextResponse.json(
        { error: 'Persetujuan eksplisit UU PDP wajib dikonfirmasi sebelum mengunggah dokumen KYC.' },
        { status: 400 }
      );
    }

    const sql = getSql();
    const countRes = await sql`SELECT COUNT(*)::int AS cnt FROM crm_accounts`;
    const nextNum = Number(countRes[0].cnt || 0) + 1;
    const prefix = accountType === 'BUMN_KORPORASI' ? 'ACC-BUMN' : 'ACC-CORP';
    const accountCode = `${prefix}-${String(nextNum).padStart(3, '0')}`;
    const nitku22 = `${npwp16}000001`;

    const inserted = await sql`
      INSERT INTO crm_accounts (
        account_code, entity_name, account_type, industry_sector,
        pic_name, pic_role, pic_email, pic_phone,
        nik_16, npwp_16, nitku_22, nib_13, city_province,
        kyc_status, pdp_explicit_consent, pdp_consent_timestamp
      ) VALUES (
        ${accountCode}, ${entityName}, ${accountType}, ${industrySector},
        ${picName}, ${picRole}, ${picEmail}, ${picPhone},
        ${nik16}, ${npwp16}, ${nitku22}, ${nib13}, ${cityProvince},
        'PENDING_REVIEW', TRUE, NOW()
      )
      RETURNING id, account_code, entity_name, kyc_status
    `;

    await writeAuditLog({
      actorName: actor.actorName,
      actorRole: actor.role,
      actionType: 'ACCOUNT_KYC_SUBMITTED',
      moduleName: 'ACCOUNTS_KYC',
      entityRef: accountCode,
      changeSummary: `Pendaftaran akun klien ${entityName} lengkap dengan NIK/NPWP 16 digit & Consent UU PDP.`,
      oldValue: null,
      newValue: `${accountCode} | KYC: PENDING_REVIEW`,
    });

    return NextResponse.json({ account: inserted[0] }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Gagal menyimpan akun KYC' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const role = (body.actorRole || 'SALES_AE') as UserRole;
    const actor = ROLE_PROFILES[role] || ROLE_PROFILES.SALES_AE;

    if (!actor.canVerifyKyc) {
      return NextResponse.json(
        { error: 'Akses Ditolak (RBAC): Hanya peran LEGAL_FINANCE yang berwenang memvalidasi dokumen KYC NIK/NPWP/NIB.' },
        { status: 403 }
      );
    }

    const accountId = Number(body.accountId);
    const status = body.status === 'REJECTED' ? 'REJECTED' : 'VERIFIED';
    const sql = getSql();

    const existing = await sql`SELECT account_code, entity_name, kyc_status FROM crm_accounts WHERE id = ${accountId}`;
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Akun tidak ditemukan.' }, { status: 404 });
    }

    await sql`
      UPDATE crm_accounts
      SET kyc_status = ${status}, kyc_verified_by = ${actor.actorName}
      WHERE id = ${accountId}
    `;

    await writeAuditLog({
      actorName: actor.actorName,
      actorRole: actor.role,
      actionType: status === 'VERIFIED' ? 'KYC_VERIFIED' : 'KYC_REJECTED',
      moduleName: 'ACCOUNTS_KYC',
      entityRef: existing[0].account_code,
      changeSummary: `Pembaruan status KYC ${existing[0].entity_name} menjadi ${status}.`,
      oldValue: existing[0].kyc_status,
      newValue: status,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Gagal memperbarui KYC' },
      { status: 500 }
    );
  }
}
