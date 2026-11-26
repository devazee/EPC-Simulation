export type Lang = 'ID' | 'EN';
export type DisplayCurrency = 'IDR' | 'USD';

const BI_MID_RATE_IDR_PER_USD = 15850;

export function formatMoney(
  amountIdr: number | string | null | undefined,
  currency: DisplayCurrency = 'IDR',
  compact = false
): string {
  const num = Number(amountIdr || 0);
  if (currency === 'USD') {
    const usd = num / BI_MID_RATE_IDR_PER_USD;
    if (compact && Math.abs(usd) >= 1_000_000) {
      return `US$${(usd / 1_000_000).toFixed(2)}M`;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(usd);
  }

  if (compact) {
    if (num === 0) return 'Rp0';
    if (Math.abs(num) >= 1_000_000_000_000) {
      return `Rp${(num / 1_000_000_000_000).toLocaleString('id-ID', { maximumFractionDigits: 2 })}\u00A0T`;
    }
    if (Math.abs(num) >= 1_000_000_000) {
      return `Rp${(num / 1_000_000_000).toLocaleString('id-ID', { maximumFractionDigits: 2 })}\u00A0M`;
    }
    if (Math.abs(num) >= 1_000_000) {
      return `Rp${(num / 1_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 })}\u00A0Jt`;
    }
  }

  return (
    'Rp' +
    new Intl.NumberFormat('id-ID', {
      maximumFractionDigits: 0,
    }).format(num)
  );
}

export function formatDateTimeId(iso: string | null | undefined): string {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return (
    d.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }) +
    ' • ' +
    d.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    }) +
    '\u00A0WIB'
  );
}

export function getSlaRemainingLabel(deadlineIso: string, status: string, lang: Lang): {
  text: string;
  tone: 'ok' | 'warn' | 'breach';
} {
  if (status === 'RESOLVED') {
    return { text: lang === 'ID' ? 'Selesai Tepat SLA' : 'Resolved Within SLA', tone: 'ok' };
  }
  const diffMs = new Date(deadlineIso).getTime() - Date.now();
  const hours = Math.floor(diffMs / 3_600_000);
  const mins = Math.floor((Math.abs(diffMs) % 3_600_000) / 60_000);
  if (diffMs < 0) {
    return {
      text: lang === 'ID' ? `Lewat SLA ${Math.abs(hours)}j ${mins}m` : `Breached ${Math.abs(hours)}h ${mins}m`,
      tone: 'breach',
    };
  }
  if (hours < 3) {
    return {
      text: lang === 'ID' ? `Sisa ${hours}j ${mins}m (Kritis)` : `${hours}h ${mins}m left`,
      tone: 'warn',
    };
  }
  return {
    text: lang === 'ID' ? `Sisa ${hours}j ${mins}m` : `${hours}h ${mins}m remaining`,
    tone: 'ok',
  };
}

export const PIPELINE_STAGES = [
  {
    code: 'RFQ_TENDER',
    labelEpc: '1. RFQ / Tender Masuk',
    labelMpc: '1. Lead & Inquiry',
    labelEn: '1. RFQ / Lead Intake',
    color: 'border-slate-300 bg-slate-100 text-slate-800',
    accent: 'bg-slate-500',
  },
  {
    code: 'AANWIJZING_SURVEY',
    labelEpc: '2. Aanwijzing & Survey',
    labelMpc: '2. Survey Lokasi & NUP',
    labelEn: '2. Site Survey / Aanwijzing',
    color: 'border-sky-300 bg-sky-50 text-sky-900',
    accent: 'bg-sky-500',
  },
  {
    code: 'PROPOSAL_BOQ',
    labelEpc: '3. Proposal Teknis & BoQ',
    labelMpc: '3. Simulasi & Reservasi',
    labelEn: '3. Technical Proposal & BoQ',
    color: 'border-indigo-300 bg-indigo-50 text-indigo-900',
    accent: 'bg-indigo-600',
  },
  {
    code: 'NEGOSIASI',
    labelEpc: '4. Klarifikasi & Negosiasi',
    labelMpc: '4. Booking Fee',
    labelEn: '4. Negotiation / Booking',
    color: 'border-amber-300 bg-amber-50 text-amber-900',
    accent: 'bg-amber-500',
  },
  {
    code: 'SPK_KONTRAK',
    labelEpc: '5. SPK / Kontrak EPC',
    labelMpc: '5. PPJB / Akad Kredit',
    labelEn: '5. Contract / SPK / PPJB',
    color: 'border-blue-300 bg-blue-50 text-blue-900',
    accent: 'bg-blue-600',
  },
  {
    code: 'BAST_HANDOVER',
    labelEpc: '6. BAST & Masa Retensi',
    labelMpc: '6. BAST Kawasan / Unit',
    labelEn: '6. Digital BAST & Retention',
    color: 'border-emerald-300 bg-emerald-50 text-emerald-900',
    accent: 'bg-emerald-600',
  },
];

export function normalizeStageForKanban(stage: string): string {
  if (stage === 'BOOKING_FEE') return 'NEGOSIASI';
  if (stage === 'PPJB_KPR') return 'SPK_KONTRAK';
  return stage;
}
