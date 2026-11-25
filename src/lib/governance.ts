export type UserRole =
  | 'DIREKSI'
  | 'VP_SALES'
  | 'MANAGER'
  | 'SALES_AE'
  | 'LEGAL_FINANCE'
  | 'PROJECT_MANAGER'
  | 'HELPDESK'
  | 'SYSADMIN';

export interface RoleProfile {
  role: UserRole;
  labelId: string;
  labelEn: string;
  actorName: string;
  division: string;
  approvalMaxLevel: number;
  canViewUnmaskedKyc: boolean;
  canVerifyKyc: boolean;
  canCreateQuote: boolean;
  canIssueContract: boolean;
  canReconcileBilling: boolean;
  canIssueBast: boolean;
  canManageSla: boolean;
}

export const ROLE_PROFILES: Record<UserRole, RoleProfile> = {
  DIREKSI: {
    role: 'DIREKSI',
    labelId: 'Direksi / C-Level',
    labelEn: 'Board of Directors / C-Level',
    actorName: 'Ir. Suryo Wibowo (Direktur Utama)',
    division: 'Board of Directors',
    approvalMaxLevel: 3,
    canViewUnmaskedKyc: true,
    canVerifyKyc: false,
    canCreateQuote: false,
    canIssueContract: true,
    canReconcileBilling: false,
    canIssueBast: true,
    canManageSla: false,
  },
  VP_SALES: {
    role: 'VP_SALES',
    labelId: 'VP Commercial / Project Director',
    labelEn: 'VP Commercial / Project Director',
    actorName: 'Haryo Baskoro, M.B.A. (VP Commercial)',
    division: 'Commercial & EPC Division',
    approvalMaxLevel: 2,
    canViewUnmaskedKyc: false,
    canVerifyKyc: false,
    canCreateQuote: true,
    canIssueContract: true,
    canReconcileBilling: false,
    canIssueBast: false,
    canManageSla: false,
  },
  MANAGER: {
    role: 'MANAGER',
    labelId: 'Sales / Bid Manager (L1)',
    labelEn: 'Sales / Bid Manager (L1)',
    actorName: 'Dian Sastroamidjojo (Bid Manager)',
    division: 'Tender & Kawasan Sales',
    approvalMaxLevel: 1,
    canViewUnmaskedKyc: false,
    canVerifyKyc: false,
    canCreateQuote: true,
    canIssueContract: false,
    canReconcileBilling: false,
    canIssueBast: false,
    canManageSla: false,
  },
  SALES_AE: {
    role: 'SALES_AE',
    labelId: 'Account Executive / Bid Engineer',
    labelEn: 'Account Executive / Bid Engineer',
    actorName: 'Raka Pratama (Senior AE)',
    division: 'Commercial Acquisition',
    approvalMaxLevel: 0,
    canViewUnmaskedKyc: false,
    canVerifyKyc: false,
    canCreateQuote: true,
    canIssueContract: false,
    canReconcileBilling: false,
    canIssueBast: false,
    canManageSla: false,
  },
  LEGAL_FINANCE: {
    role: 'LEGAL_FINANCE',
    labelId: 'Legal, Tax & Finance Officer',
    labelEn: 'Legal, Tax & Finance Officer',
    actorName: 'Arif Budiman, S.H., BKP (Legal & Tax)',
    division: 'Corporate Legal, Tax & Treasury',
    approvalMaxLevel: 0,
    canViewUnmaskedKyc: true,
    canVerifyKyc: true,
    canCreateQuote: false,
    canIssueContract: true,
    canReconcileBilling: true,
    canIssueBast: false,
    canManageSla: false,
  },
  PROJECT_MANAGER: {
    role: 'PROJECT_MANAGER',
    labelId: 'Project / Estate Manager',
    labelEn: 'Project / Estate Manager',
    actorName: 'Ir. Dimas Prakoso, PMP (Project Manager)',
    division: 'EPC Delivery & Estate Ops',
    approvalMaxLevel: 0,
    canViewUnmaskedKyc: false,
    canVerifyKyc: false,
    canCreateQuote: false,
    canIssueContract: false,
    canReconcileBilling: false,
    canIssueBast: true,
    canManageSla: true,
  },
  HELPDESK: {
    role: 'HELPDESK',
    labelId: 'Customer Care & Retention SLA',
    labelEn: 'Customer Care & Retention SLA',
    actorName: 'Putri Maharani (Retention Desk)',
    division: 'ITIL v4 Service Desk',
    approvalMaxLevel: 0,
    canViewUnmaskedKyc: false,
    canVerifyKyc: false,
    canCreateQuote: false,
    canIssueContract: false,
    canReconcileBilling: false,
    canIssueBast: false,
    canManageSla: true,
  },
  SYSADMIN: {
    role: 'SYSADMIN',
    labelId: 'System Administrator (ISO 27001)',
    labelEn: 'System Administrator (ISO 27001)',
    actorName: 'Reza Mahendra, CISSP (IT SecOps)',
    division: 'IT Governance & Security',
    approvalMaxLevel: 0,
    canViewUnmaskedKyc: false,
    canVerifyKyc: false,
    canCreateQuote: false,
    canIssueContract: false,
    canReconcileBilling: false,
    canIssueBast: false,
    canManageSla: false,
  },
};

/**
 * UU No. 27 Tahun 2022 (UU PDP) Field Masking Utility
 * Masks sensitive 16-digit NIK / NPWP / NITKU for roles without explicit KYC clearance.
 */
export function maskSensitiveIdentity(raw: string | null | undefined, canViewFull: boolean): string {
  if (!raw) return '-';
  if (canViewFull) return raw;
  if (raw.length <= 8) return '****';
  return `${raw.slice(0, 4)}${'*'.repeat(Math.max(4, raw.length - 8))}${raw.slice(-4)}`;
}

export type PphScheme = 'PPH_FINAL_EPC_265' | 'PPH_23_JASA_200' | 'PPH_FINAL_PROP_250' | 'NONE';

export const PPH_SCHEMES: Record<PphScheme, { rate: number; labelId: string; labelEn: string }> = {
  PPH_FINAL_EPC_265: {
    rate: 2.65,
    labelId: 'PPh Final Pasal 4(2) Konstruksi Terintegrasi EPC (2,65%)',
    labelEn: 'Final Income Tax Art. 4(2) Integrated EPC Construction (2.65%)',
  },
  PPH_FINAL_PROP_250: {
    rate: 2.5,
    labelId: 'PPh Final Pasal 4(2) Pengalihan Hak Tanah/Bangunan MPC (2,50%)',
    labelEn: 'Final Income Tax Art. 4(2) Land/Building Transfer MPC (2.50%)',
  },
  PPH_23_JASA_200: {
    rate: 2.0,
    labelId: 'PPh Pasal 23 Jasa Teknik, Manajemen & Konsultansi (2,00%)',
    labelEn: 'Withholding Tax Art. 23 Technical & Management Services (2.00%)',
  },
  NONE: {
    rate: 0,
    labelId: 'Tanpa Pemotongan PPh Di Muka (0%)',
    labelEn: 'No Upfront Withholding Tax (0%)',
  },
};

/**
 * Corporate Approval Matrix (Standar BUMN / Korporasi Tbk Indonesia)
 * - Level 0: Auto-Approved (0% discount, 0 term deviation, < Rp50B)
 * - Level 1: Manager (<= 3% discount or <= 7 days term shift) — SLA 4h
 * - Level 2: VP / GM (> 3% to 7% discount) — SLA 8h
 * - Level 3: Direksi / Komite Proyek (> 7% discount OR Strategic Value >= Rp50 Miliar) — SLA 24h
 */
export function calculateQuotationAndApproval(params: {
  subtotalDpp: number;
  discountPct: number;
  ppnRate: number;
  pphScheme: PphScheme;
  termDeviationDays?: number;
}) {
  const subtotalDpp = Math.max(0, Number(params.subtotalDpp) || 0);
  const discountPct = Math.min(50, Math.max(0, Number(params.discountPct) || 0));
  const ppnRate = Number(params.ppnRate) === 12 ? 12 : 11;
  const pphInfo = PPH_SCHEMES[params.pphScheme] || PPH_SCHEMES.PPH_FINAL_EPC_265;
  const termDeviationDays = Math.max(0, Number(params.termDeviationDays) || 0);

  const discountAmount = Math.round(subtotalDpp * (discountPct / 100));
  const netDpp = subtotalDpp - discountAmount;
  const ppnAmount = Math.round(netDpp * (ppnRate / 100));
  const pphAmount = Math.round(netDpp * (pphInfo.rate / 100));
  const grandTotalGross = netDpp + ppnAmount;
  const netCashReceivable = grandTotalGross - pphAmount;

  let requiredLevel = 0;
  let approvalStatus = 'AUTO_APPROVED';
  let slaHours = 0;

  if (discountPct > 7 || netDpp >= 50_000_000_000 || termDeviationDays > 14) {
    requiredLevel = 3;
    approvalStatus = 'PENDING_L3';
    slaHours = 24;
  } else if (discountPct > 3 || termDeviationDays > 7) {
    requiredLevel = 2;
    approvalStatus = 'PENDING_L2';
    slaHours = 8;
  } else if (discountPct > 0 || termDeviationDays > 0) {
    requiredLevel = 1;
    approvalStatus = 'PENDING_L1';
    slaHours = 4;
  }

  return {
    subtotalDpp,
    discountPct,
    discountAmount,
    netDpp,
    ppnRate,
    ppnAmount,
    pphScheme: params.pphScheme,
    pphRate: pphInfo.rate,
    pphAmount,
    grandTotalGross,
    netCashReceivable,
    termDeviationDays,
    requiredLevel,
    approvalStatus,
    slaHours,
  };
}
