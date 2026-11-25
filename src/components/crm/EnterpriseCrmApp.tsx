'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  LayoutDashboard,
  MessageSquareMore,
  Kanban,
  Building2,
  Receipt,
  ShieldAlert,
  FileText,
  Search,
  Database,
  Bell,
  ChevronLeft,
  ChevronRight,
  Plus,
  CheckCircle2,
  ArrowRight,
  Globe2,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { ROLE_PROFILES, UserRole } from '@/lib/governance';
import {
  DisplayCurrency,
  formatMoney,
  Lang,
  normalizeStageForKanban,
  PIPELINE_STAGES,
} from '@/lib/formatters';
import { CommandModal, SearchableItem } from './CommandModal';
import { CorporateDocsPanel } from './CorporateDocsPanel';
import {
  AccountsKycContractsView,
  BillingAndBastView,
  SlaAndGovernanceView,
} from './OperationsPanels';

/* eslint-disable @typescript-eslint/no-explicit-any */

type ActiveTab =
  | 'dashboard'
  | 'leads'
  | 'pipeline'
  | 'accounts'
  | 'billing'
  | 'governance'
  | 'docs';

export function EnterpriseCrmApp() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [role, setRole] = useState<UserRole>('DIREKSI');
  const [lang, setLang] = useState<Lang>('ID');
  const [currency, setCurrency] = useState<DisplayCurrency>('IDR');
  const [commandOpen, setCommandOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);

  // Leads state
  const [channelFilter, setChannelFilter] = useState<string>('ALL');
  const [leadName, setLeadName] = useState('');
  const [leadTitle, setLeadTitle] = useState('VP Procurement & EPC');
  const [leadCompany, setLeadCompany] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadPhone, setLeadPhone] = useState('+62812');
  const [leadChannel, setLeadChannel] = useState('LPSE_TENDER');
  const [leadSegment, setLeadSegment] = useState<'EPC_B2B' | 'MPC_PROPERTI'>('EPC_B2B');
  const [leadBudget, setLeadBudget] = useState('35000000000');
  const [leadMessage, setLeadMessage] = useState('');
  const [leadPdpConsent, setLeadPdpConsent] = useState(true);

  // Pipeline state
  const [pipelineModeFilter, setPipelineModeFilter] = useState<'ALL' | 'EPC_B2B' | 'MPC_PROPERTI'>('ALL');
  const [pipelineViewMode, setPipelineViewMode] = useState<'KANBAN' | 'TABLE'>('KANBAN');
  const [newDealOpen, setNewDealOpen] = useState(false);
  const [dealProjectName, setDealProjectName] = useState('');
  const [dealAccountId, setDealAccountId] = useState('');
  const [dealMode, setDealMode] = useState<'EPC_B2B' | 'MPC_PROPERTI'>('EPC_B2B');
  const [dealValue, setDealValue] = useState('42000000000');
  const [dealCity, setDealCity] = useState('Surabaya');
  const [dealProvince, setDealProvince] = useState('Jawa Timur (WIB)');

  const notify = useCallback((type: 'ok' | 'err', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4500);
  }, []);

  const fetchBootstrap = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/crm/bootstrap?role=${role}`, { cache: 'no-store' });
      const json = await res.json();
      setData(json);
    } catch {
      notify('err', 'Gagal memuat data dari server CRM.');
    } finally {
      setLoading(false);
    }
  }, [role, notify]);

  useEffect(() => {
    fetchBootstrap();
  }, [fetchBootstrap]);

  // Ctrl+K Global Command Search shortcut
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const activeRoleProfile = ROLE_PROFILES[role];

  const searchableItems = useMemo<SearchableItem[]>(() => {
    if (!data?.configured) return [];
    const items: SearchableItem[] = [];
    for (const d of data.deals || []) {
      items.push({
        id: `deal-${d.id}`,
        category: 'DEAL',
        code: d.deal_code,
        title: d.project_name,
        subtitle: `${d.account_name || 'Korporasi'} • ${d.location_city} • ${d.stage}`,
        targetTab: 'pipeline',
      });
    }
    for (const a of data.accounts || []) {
      items.push({
        id: `acc-${a.id}`,
        category: 'ACCOUNT',
        code: a.account_code,
        title: a.entity_name,
        subtitle: `PIC: ${a.pic_name} • KYC: ${a.kyc_status}`,
        targetTab: 'accounts',
      });
    }
    for (const c of data.contracts || []) {
      items.push({
        id: `con-${c.id}`,
        category: 'CONTRACT',
        code: c.contract_number,
        title: c.project_name,
        subtitle: `e-Meterai: ${c.emeterai_serial} • ${c.psre_provider}`,
        targetTab: 'accounts',
      });
    }
    for (const b of data.billings || []) {
      items.push({
        id: `inv-${b.id}`,
        category: 'INVOICE',
        code: b.invoice_number,
        title: b.term_name,
        subtitle: `VA SNAP BI: ${b.snap_va_number} • ${b.payment_status}`,
        targetTab: 'billing',
      });
    }
    items.push(
      {
        id: 'doc-prd',
        category: 'DOC',
        code: 'MPC/IT-PMO/PRD/CRM-APP/2026/001',
        title: 'Product Requirements Document (PRD)',
        subtitle: 'Dokumen Standar Korporasi Besar Indonesia',
        targetTab: 'docs',
      },
      {
        id: 'doc-bast',
        category: 'DOC',
        code: 'MPC/LEGAL-IT/BAST/CRM-APP/2026/001',
        title: 'Template Berita Acara Serah Terima (BA-UAT / BAST)',
        subtitle: 'Instrumen Hukum Go-Live & Pencairan Termin',
        targetTab: 'docs',
      }
    );
    return items;
  }, [data]);

  const filteredDeals = useMemo(() => {
    const list = data?.deals || [];
    if (pipelineModeFilter === 'ALL') return list;
    return list.filter((d: any) => d.pipeline_mode === pipelineModeFilter);
  }, [data?.deals, pipelineModeFilter]);

  const filteredLeads = useMemo(() => {
    const list = data?.leads || [];
    if (channelFilter === 'ALL') return list;
    return list.filter((l: any) => l.channel === channelFilter);
  }, [data?.leads, channelFilter]);

  async function handleAddLead(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch('/api/crm/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actorRole: role,
          fullName: leadName,
          jobTitle: leadTitle,
          companyName: leadCompany,
          email: leadEmail,
          phone: leadPhone,
          channel: leadChannel,
          segmentMode: leadSegment,
          estimatedBudget: Number(leadBudget),
          lastMessage: leadMessage,
          pdpConsent: leadPdpConsent,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      notify(
        'ok',
        `Prospek ${json.lead.lead_code} berhasil disimpan ke Neon DB (Skor BANT: ${json.lead.bant_score}/100).`
      );
      setLeadName('');
      setLeadCompany('');
      setLeadEmail('');
      setLeadMessage('');
      await fetchBootstrap();
    } catch (err: any) {
      notify('err', err.message);
    }
  }

  async function handleAdvanceDealStage(deal: any, nextStage: string) {
    try {
      const res = await fetch('/api/crm/deals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actorRole: role, dealId: deal.id, stage: nextStage }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      notify('ok', `Proyek ${deal.deal_code} dipindahkan ke tahap ${nextStage}.`);
      await fetchBootstrap();
    } catch (err: any) {
      notify('err', err.message);
    }
  }

  async function handleUpdateDealProgress(dealId: number, physicalProgress: number) {
    try {
      const res = await fetch('/api/crm/deals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actorRole: role, dealId, physicalProgress }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      notify('ok', `Progres fisik proyek diperbarui menjadi ${physicalProgress}%.`);
      await fetchBootstrap();
    } catch (err: any) {
      notify('err', err.message);
    }
  }

  async function handleCreateDeal(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch('/api/crm/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actorRole: role,
          projectName: dealProjectName,
          accountId: Number(dealAccountId || data?.accounts?.[0]?.id),
          pipelineMode: dealMode,
          stage: 'RFQ_TENDER',
          estimatedValue: Number(dealValue),
          locationCity: dealCity,
          provinceRegion: dealProvince,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      notify('ok', `Peluang proyek ${json.deal.deal_code} ditambahkan ke Pipeline.`);
      setDealProjectName('');
      setNewDealOpen(false);
      await fetchBootstrap();
    } catch (err: any) {
      notify('err', err.message);
    }
  }

  async function handleQuickApprove(quoteId: number) {
    try {
      const res = await fetch('/api/crm/quotations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actorRole: role, quoteId, decision: 'APPROVED' }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      notify('ok', 'Pengajuan deviasi penawaran telah disetujui dan tercatat di Audit Log.');
      await fetchBootstrap();
    } catch (err: any) {
      notify('err', err.message);
    }
  }

  const navItems: { id: ActiveTab; labelId: string; labelEn: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: 'dashboard',
      labelId: 'Executive Command',
      labelEn: 'Executive Command',
      icon: <LayoutDashboard className="h-4 w-4" />,
    },
    {
      id: 'leads',
      labelId: 'Leads & Omnichannel',
      labelEn: 'Leads & Omnichannel',
      icon: <MessageSquareMore className="h-4 w-4" />,
      badge: data?.kpis?.totalLeads,
    },
    {
      id: 'pipeline',
      labelId: 'Deals & Pipeline EPC/MPC',
      labelEn: 'EPC/MPC Project Pipeline',
      icon: <Kanban className="h-4 w-4" />,
      badge: data?.kpis?.totalDeals,
    },
    {
      id: 'accounts',
      labelId: 'KYC, CPQ & Kontrak',
      labelEn: 'KYC, CPQ & Contracts',
      icon: <Building2 className="h-4 w-4" />,
      badge: data?.kpis?.pendingApprovalsCount || undefined,
    },
    {
      id: 'billing',
      labelId: 'Termin, VA & BAST',
      labelEn: 'Billing, VA & Digital BAST',
      icon: <Receipt className="h-4 w-4" />,
    },
    {
      id: 'governance',
      labelId: 'SLA Retensi & Audit ISO',
      labelEn: 'Retention SLA & Audit Log',
      icon: <ShieldAlert className="h-4 w-4" />,
      badge: data?.kpis?.openSlaTicketsCount || undefined,
    },
    {
      id: 'docs',
      labelId: 'Dokumen Korporasi',
      labelEn: 'Corporate SDLC Docs',
      icon: <FileText className="h-4 w-4" />,
    },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {/* Collapsible Enterprise Sidebar */}
      <aside
        className={`no-print sticky top-0 flex h-screen shrink-0 flex-col border-r border-slate-800 bg-slate-950 text-slate-200 transition-all duration-200 ${
          sidebarCollapsed ? 'w-20' : 'w-68'
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-4">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 font-black text-white shadow">
              M
            </div>
            {!sidebarCollapsed && (
              <div className="truncate">
                <p className="truncate text-xs font-extrabold tracking-wide text-white">
                  NUSANTARA MPC•EPC
                </p>
                <p className="truncate text-[10px] text-slate-400">
                  Enterprise CRM • ISO 27001
                </p>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setSidebarCollapsed((v) => !v)}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
            aria-label="Toggle Sidebar"
          >
            {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navItems.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition ${
                  active
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-3 truncate">
                  {item.icon}
                  {!sidebarCollapsed && (
                    <span className="truncate">{lang === 'ID' ? item.labelId : item.labelEn}</span>
                  )}
                </span>
                {!sidebarCollapsed && item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-bold ${
                      active ? 'bg-white/20 text-white' : 'bg-slate-800 text-blue-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {!sidebarCollapsed && (
          <div className="border-t border-slate-800 p-4 text-[11px] text-slate-400 space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
              <Database className="h-3.5 w-3.5" />
              <span>Neon Postgres TLS 1.3</span>
            </div>
            <p className="leading-snug text-slate-400">
              UU PDP No. 27/2022 • PERURI e-Meterai • PSrE Komdigi • Coretax DJP
            </p>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Global Top Command Bar */}
        <header className="no-print sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-6 py-3 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCommandOpen(true)}
                className="flex items-center gap-3 rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs text-slate-500 transition hover:border-blue-400 hover:bg-white sm:w-80"
              >
                <Search className="h-4 w-4 text-slate-400" />
                <span className="truncate">
                  {lang === 'ID' ? 'Cari proyek, akun, SPK, VA...' : 'Search projects, KYC, SPK...'}
                </span>
                <kbd className="ml-auto rounded border border-slate-300 bg-white px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-600">
                  Ctrl+K
                </kbd>
              </button>

              <button
                type="button"
                onClick={() => fetchBootstrap()}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                title="Sinkronisasi ulang dengan Neon PostgreSQL"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Role Switcher for Live RBAC Simulation */}
              <div className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/70 px-2.5 py-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800">
                  Simulasi Peran RBAC:
                </span>
                <select
                  aria-label="Pilih Peran Pengguna RBAC"
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="bg-transparent text-xs font-bold text-slate-900 focus:outline-none"
                >
                  {(Object.keys(ROLE_PROFILES) as UserRole[]).map((rKey) => (
                    <option key={rKey} value={rKey}>
                      {ROLE_PROFILES[rKey].labelId}
                    </option>
                  ))}
                </select>
              </div>

              {/* Approval Inbox Pill */}
              <button
                type="button"
                onClick={() => setActiveTab('accounts')}
                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-900 hover:bg-amber-100"
              >
                <Bell className="h-3.5 w-3.5 text-amber-700" />
                <span>Approval: {data?.kpis?.pendingApprovalsCount ?? 0}</span>
              </button>

              {/* Currency Switcher */}
              <button
                type="button"
                onClick={() => setCurrency((c) => (c === 'IDR' ? 'USD' : 'IDR'))}
                className="rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 font-mono text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                {currency}
              </button>

              {/* Language Switcher */}
              <button
                type="button"
                onClick={() => setLang((l) => (l === 'ID' ? 'EN' : 'ID'))}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                <Globe2 className="h-3.5 w-3.5 text-blue-600" />
                {lang}
              </button>
            </div>
          </div>
        </header>

        {/* Notification Toast */}
        {toast && (
          <div className="no-print fixed bottom-5 right-5 z-50 max-w-md rounded-2xl border bg-white p-4 shadow-xl">
            <div className="flex items-start gap-2.5">
              <Sparkles
                className={`mt-0.5 h-4 w-4 shrink-0 ${
                  toast.type === 'ok' ? 'text-emerald-600' : 'text-rose-600'
                }`}
              />
              <p
                className={`text-xs font-semibold ${
                  toast.type === 'ok' ? 'text-slate-900' : 'text-rose-700'
                }`}
              >
                {toast.msg}
              </p>
            </div>
          </div>
        )}

        {/* Main Workspace Body */}
        <main className="flex-1 p-6">
          {data && data.configured === false ? (
            <div className="mx-auto max-w-2xl rounded-2xl border border-amber-300 bg-amber-50 p-6 text-amber-950">
              <h2 className="text-base font-bold">Konfigurasi Environment Database Diperlukan</h2>
              <p className="mt-2 text-xs leading-relaxed">
                Variabel <code className="font-mono font-bold">DATABASE_URL</code> belum diatur pada environment ini.
                Tambahkan connection string Neon PostgreSQL Anda di menu{' '}
                <strong>Vercel Project Settings → Environment Variables</strong> lalu lakukan redeploy.
              </p>
            </div>
          ) : data?.error ? (
            <div className="mx-auto max-w-2xl rounded-2xl border border-rose-300 bg-rose-50 p-6 text-rose-950">
              <h2 className="text-base font-bold">Koneksi Database Mengalami Kendala</h2>
              <p className="mt-1 font-mono text-xs">{data.error}</p>
            </div>
          ) : !data ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="h-28 animate-pulse rounded-2xl bg-slate-200/70" />
              ))}
            </div>
          ) : (
            <>
              {/* MODULE 1: EXECUTIVE COMMAND CENTER */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-0.5 text-[11px] font-bold text-blue-800">
                        {activeRoleProfile.actorName} • {activeRoleProfile.division}
                      </span>
                      <h1 className="mt-1.5 text-xl font-extrabold tracking-tight text-slate-900">
                        {lang === 'ID'
                          ? 'Executive Command Center — Proyek EPC & Kawasan MPC Indonesia'
                          : 'Executive Command Center — Indonesian EPC & MPC Portfolio'}
                      </h1>
                    </div>
                    <div className="text-right text-xs text-slate-500">
                      Data Residency: <strong>ap-southeast-1 (TLS Encrypted)</strong> • Kepatuhan:{' '}
                      <strong>UU PDP & Coretax DJP</strong>
                    </div>
                  </div>

                  {/* KPI Grid */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <p className="text-xs font-semibold text-slate-500">
                        {lang === 'ID' ? 'Total Nilai Pipeline Aktif' : 'Total Active Pipeline'}
                      </p>
                      <p className="mt-2 font-mono text-2xl font-black text-slate-900">
                        {formatMoney(data.kpis.totalPipelineValue, currency, true)}
                      </p>
                      <p className="mt-1 text-xs text-emerald-700 font-semibold">
                        Weighted Forecast: {formatMoney(data.kpis.weightedForecastValue, currency, true)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <p className="text-xs font-semibold text-slate-500">
                        {lang === 'ID' ? 'Nilai Kontrak Terikat (SPK/PPJB)' : 'Signed Contract Value'}
                      </p>
                      <p className="mt-2 font-mono text-2xl font-black text-blue-700">
                        {formatMoney(data.kpis.contractedValue, currency, true)}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        e-Meterai PERURI & PSrE Terverifikasi
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <p className="text-xs font-semibold text-slate-500">
                        {lang === 'ID' ? 'Realisasi Kas Masuk (Termin PAID)' : 'Realized Cash Inflow'}
                      </p>
                      <p className="mt-2 font-mono text-2xl font-black text-emerald-700">
                        {formatMoney(data.kpis.paidCashIn, currency, true)}
                      </p>
                      <p className="mt-1 text-xs text-amber-700 font-semibold">
                        Piutang Termin Aktif: {formatMoney(data.kpis.outstandingReceivables, currency, true)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <p className="text-xs font-semibold text-slate-500">
                        {lang === 'ID' ? 'Kepatuhan KYC, Approval & SLA' : 'Governance & SLA Health'}
                      </p>
                      <div className="mt-2 flex items-baseline gap-3">
                        <span className="font-mono text-2xl font-black text-slate-900">
                          {data.kpis.verifiedAccounts}/{data.kpis.totalAccounts}
                        </span>
                        <span className="text-xs font-semibold text-emerald-700">KYC Verified</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {data.kpis.pendingApprovalsCount} Pending Approval • {data.kpis.openSlaTicketsCount} Tiket SLA Aktif
                      </p>
                    </div>
                  </div>

                  {/* Funnel + Pending Approvals */}
                  <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-7">
                      <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-sm font-bold text-slate-900">
                          Distribusi Tahapan Proyek Nasional (EPC B2B & Kawasan MPC)
                        </h2>
                        <button
                          type="button"
                          onClick={() => setActiveTab('pipeline')}
                          className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:underline"
                        >
                          Buka Kanban <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="space-y-3">
                        {PIPELINE_STAGES.map((st) => {
                          const stageDeals = (data.deals || []).filter(
                            (d: any) => normalizeStageForKanban(d.stage) === st.code
                          );
                          const sumVal = stageDeals.reduce(
                            (acc: number, d: any) => acc + Number(d.estimated_value || 0),
                            0
                          );
                          const pct =
                            data.kpis.totalPipelineValue > 0
                              ? Math.round((sumVal / data.kpis.totalPipelineValue) * 100)
                              : 0;
                          return (
                            <div key={st.code} className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-slate-800">
                                  {lang === 'ID' ? st.labelEpc : st.labelEn}{' '}
                                  <span className="text-slate-400">({stageDeals.length} proyek)</span>
                                </span>
                                <span className="font-mono font-bold text-slate-900">
                                  {formatMoney(sumVal, currency, true)} ({pct}%)
                                </span>
                              </div>
                              <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                                <div
                                  className="h-full rounded-full bg-blue-600 transition-all"
                                  style={{ width: `${Math.max(pct, stageDeals.length > 0 ? 6 : 0)}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Regional Footprint */}
                      <div className="mt-6 border-t border-slate-100 pt-4">
                        <h3 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                          Sebaran Lokasi Proyek Strategis di Indonesia
                        </h3>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                          {(data.deals || []).slice(0, 6).map((d: any) => (
                            <div
                              key={d.id}
                              className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-900">{d.location_city}</span>
                                <span className="font-mono text-[10px] font-bold text-blue-700">
                                  Fisik {d.physical_progress}%
                                </span>
                              </div>
                              <p className="truncate text-[11px] text-slate-500">{d.project_name}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Executive Approval Inbox */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-5">
                      <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-sm font-bold text-slate-900">
                          Antrean Otorisasi Deviasi Harga / Termin
                        </h2>
                        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-900">
                          SLA Berjenjang
                        </span>
                      </div>

                      <div className="space-y-3">
                        {(data.quotations || [])
                          .filter((q: any) => String(q.approval_status).startsWith('PENDING_'))
                          .map((q: any) => (
                            <div
                              key={q.id}
                              className="rounded-xl border border-amber-200 bg-amber-50/50 p-3.5"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <span className="font-mono text-[11px] font-bold text-amber-900">
                                    {q.quote_number} • Wajib Level {q.required_approval_level}
                                  </span>
                                  <p className="mt-0.5 text-xs font-bold text-slate-900">
                                    {q.project_name}
                                  </p>
                                </div>
                                <span className="font-mono text-xs font-extrabold text-slate-900">
                                  {formatMoney(q.grand_total_gross, currency, true)}
                                </span>
                              </div>
                              <p className="mt-1 text-[11px] text-slate-600">
                                Diskon {q.discount_pct}% • SLA {q.sla_hours} Jam • Oleh {q.requested_by}
                              </p>
                              <div className="mt-2.5 flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleQuickApprove(q.id)}
                                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1 text-xs font-bold text-white hover:bg-emerald-700"
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  Setujui Sekarang
                                </button>
                              </div>
                            </div>
                          ))}

                        {(data.quotations || []).filter((q: any) =>
                          String(q.approval_status).startsWith('PENDING_')
                        ).length === 0 && (
                          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-900">
                            Seluruh pengajuan penawaran telah diputuskan tepat SLA.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* MODULE 2: OMNICHANNEL LEADS */}
              {activeTab === 'leads' && (
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
                  <form
                    onSubmit={handleAddLead}
                    className="space-y-3.5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-4"
                  >
                    <h2 className="text-sm font-bold text-slate-900">
                      Akuisisi Prospek Omnichannel & Validasi UU PDP
                    </h2>
                    <p className="text-xs text-slate-500">
                      Dilengkapi Auto-Deduplikasi email/nomor telepon & perhitungan Skor BANT otomatis.
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700">Nama Prospek</label>
                        <input
                          type="text"
                          required
                          value={leadName}
                          onChange={(e) => setLeadName(e.target.value)}
                          placeholder="Ir. Andi Wijaya"
                          className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700">Jabatan</label>
                        <input
                          type="text"
                          value={leadTitle}
                          onChange={(e) => setLeadTitle(e.target.value)}
                          className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700">Institusi / Perusahaan</label>
                      <input
                        type="text"
                        required
                        value={leadCompany}
                        onChange={(e) => setLeadCompany(e.target.value)}
                        placeholder="PT Pelabuhan Energi Timur"
                        className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700">Email Korporasi</label>
                        <input
                          type="email"
                          required
                          value={leadEmail}
                          onChange={(e) => setLeadEmail(e.target.value)}
                          placeholder="andi@pelabuhan.co.id"
                          className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700">No. WhatsApp</label>
                        <input
                          type="text"
                          required
                          value={leadPhone}
                          onChange={(e) => setLeadPhone(e.target.value)}
                          className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700">Kanal Masuk</label>
                        <select
                          value={leadChannel}
                          onChange={(e) => setLeadChannel(e.target.value)}
                          className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs"
                        >
                          <option value="LPSE_TENDER">Portal e-Proc / Tender</option>
                          <option value="WABA">WhatsApp Business API</option>
                          <option value="WEB_PORTAL">Website Inquiry</option>
                          <option value="EVENT_QR">QR Buku Tamu Expo</option>
                          <option value="PARTNER_REF">Rujukan Mitra / Agen</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700">Mode Vertikal</label>
                        <select
                          value={leadSegment}
                          onChange={(e) => setLeadSegment(e.target.value as 'EPC_B2B' | 'MPC_PROPERTI')}
                          className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs"
                        >
                          <option value="EPC_B2B">Proyek EPC B2B</option>
                          <option value="MPC_PROPERTI">Kawasan Terpadu MPC</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700">
                        Indikasi Nilai Anggaran / Capex (IDR)
                      </label>
                      <input
                        type="number"
                        value={leadBudget}
                        onChange={(e) => setLeadBudget(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 font-mono text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700">
                        Catatan Kebutuhan / Pesan Masuk
                      </label>
                      <textarea
                        rows={2}
                        value={leadMessage}
                        onChange={(e) => setLeadMessage(e.target.value)}
                        placeholder="Ringkasan RFQ/kebutuhan lahan atau fasilitas..."
                        className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
                      />
                    </div>

                    <label className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-[11px] text-slate-700">
                      <input
                        type="checkbox"
                        checked={leadPdpConsent}
                        onChange={(e) => setLeadPdpConsent(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600"
                      />
                      <span>
                        Rekam <strong>Timestamp Explicit Consent UU PDP No. 27/2022</strong> atas pemrosesan data kontak prospek.
                      </span>
                    </label>

                    <button
                      type="submit"
                      className="w-full rounded-xl bg-blue-700 py-2.5 text-xs font-bold text-white hover:bg-blue-800"
                    >
                      Simpan Prospek & Hitung Skor BANT
                    </button>
                  </form>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-8">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                      <h2 className="text-sm font-bold text-slate-900">
                        Omnichannel Lead Inbox & Skor Kualifikasi BANT
                      </h2>
                      <div className="flex flex-wrap gap-1.5">
                        {['ALL', 'LPSE_TENDER', 'WABA', 'WEB_PORTAL', 'EVENT_QR', 'PARTNER_REF'].map((ch) => (
                          <button
                            key={ch}
                            type="button"
                            onClick={() => setChannelFilter(ch)}
                            className={`rounded-lg px-2.5 py-1 text-[11px] font-bold ${
                              channelFilter === ch
                                ? 'bg-blue-700 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {ch}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      {filteredLeads.map((l: any) => (
                        <div key={l.id} className="rounded-xl border border-slate-200 p-4 hover:border-blue-300">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-blue-700">
                                  {l.lead_code}
                                </span>
                                <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                                  {l.channel}
                                </span>
                                <span className="rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-800">
                                  {l.segment_mode}
                                </span>
                              </div>
                              <h3 className="mt-1 text-sm font-bold text-slate-900">
                                {l.company_name} — <span className="font-medium">{l.full_name}</span>
                              </h3>
                              <p className="text-[11px] text-slate-500">
                                {l.job_title} • {l.email} • {l.phone} • PIC AE: {l.assigned_ae}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 font-mono text-xs font-extrabold text-emerald-800">
                                BANT {l.bant_score}/100
                              </span>
                              <p className="mt-1 font-mono text-xs font-bold text-slate-900">
                                {formatMoney(l.estimated_budget, currency, true)}
                              </p>
                            </div>
                          </div>
                          {l.last_message && (
                            <p className="mt-2.5 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-700">
                              &ldquo;{l.last_message}&rdquo;
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* MODULE 3: HYBRID PIPELINE (KANBAN & TABLE) */}
              {activeTab === 'pipeline' && (
                <div className="space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      {(['ALL', 'EPC_B2B', 'MPC_PROPERTI'] as const).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setPipelineModeFilter(m)}
                          className={`rounded-xl px-3.5 py-1.5 text-xs font-bold ${
                            pipelineModeFilter === m
                              ? 'bg-blue-700 text-white'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {m === 'ALL'
                            ? 'Semua Proyek (Hybrid)'
                            : m === 'EPC_B2B'
                            ? 'Mode Proyek EPC B2B'
                            : 'Mode Kawasan / Properti MPC'}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-1">
                        <button
                          type="button"
                          onClick={() => setPipelineViewMode('KANBAN')}
                          className={`rounded-lg px-3 py-1 text-xs font-bold ${
                            pipelineViewMode === 'KANBAN' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600'
                          }`}
                        >
                          Kanban Board
                        </button>
                        <button
                          type="button"
                          onClick={() => setPipelineViewMode('TABLE')}
                          className={`rounded-lg px-3 py-1 text-xs font-bold ${
                            pipelineViewMode === 'TABLE' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600'
                          }`}
                        >
                          High-Density Table
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => setNewDealOpen((v) => !v)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-blue-700 px-3.5 py-2 text-xs font-bold text-white hover:bg-blue-800"
                      >
                        <Plus className="h-4 w-4" /> Proyek Baru
                      </button>
                    </div>
                  </div>

                  {newDealOpen && (
                    <form
                      onSubmit={handleCreateDeal}
                      className="grid grid-cols-1 gap-3 rounded-2xl border border-blue-200 bg-blue-50/50 p-4 sm:grid-cols-6"
                    >
                      <input
                        type="text"
                        required
                        value={dealProjectName}
                        onChange={(e) => setDealProjectName(e.target.value)}
                        placeholder="Nama Paket Proyek EPC / Lot MPC..."
                        className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs sm:col-span-2"
                      />
                      <select
                        value={dealAccountId}
                        onChange={(e) => setDealAccountId(e.target.value)}
                        className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs"
                      >
                        {(data.accounts || []).map((a: any) => (
                          <option key={a.id} value={a.id}>
                            {a.entity_name}
                          </option>
                        ))}
                      </select>
                      <select
                        value={dealMode}
                        onChange={(e) => setDealMode(e.target.value as 'EPC_B2B' | 'MPC_PROPERTI')}
                        className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs"
                      >
                        <option value="EPC_B2B">EPC Konstruksi B2B</option>
                        <option value="MPC_PROPERTI">Kawasan MPC</option>
                      </select>
                      <input
                        type="number"
                        value={dealValue}
                        onChange={(e) => setDealValue(e.target.value)}
                        placeholder="Nilai Proyek (IDR)"
                        className="rounded-xl border border-slate-300 bg-white px-3 py-2 font-mono text-xs"
                      />
                      <button
                        type="submit"
                        className="rounded-xl bg-blue-700 px-4 py-2 text-xs font-bold text-white hover:bg-blue-800"
                      >
                        Simpan Proyek
                      </button>
                    </form>
                  )}

                  {pipelineViewMode === 'KANBAN' ? (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
                      {PIPELINE_STAGES.map((st, idx) => {
                        const cards = filteredDeals.filter(
                          (d: any) => normalizeStageForKanban(d.stage) === st.code
                        );
                        const nextStage = PIPELINE_STAGES[idx + 1]?.code;
                        return (
                          <div
                            key={st.code}
                            className="flex flex-col rounded-2xl border border-slate-200 bg-slate-100/80 p-3"
                          >
                            <div className={`mb-3 rounded-xl border px-3 py-2 ${st.color}`}>
                              <p className="text-xs font-extrabold">
                                {pipelineModeFilter === 'MPC_PROPERTI' ? st.labelMpc : st.labelEpc}
                              </p>
                              <p className="mt-0.5 font-mono text-[11px] opacity-80">
                                {cards.length} Proyek
                              </p>
                            </div>

                            <div className="space-y-2.5">
                              {cards.map((d: any) => (
                                <div
                                  key={d.id}
                                  className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-blue-400"
                                >
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="font-mono text-[10px] font-bold text-blue-700">
                                      {d.deal_code}
                                    </span>
                                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                                      {d.win_probability}%
                                    </span>
                                  </div>
                                  <h4 className="mt-1 text-xs font-bold leading-snug text-slate-900">
                                    {d.project_name}
                                  </h4>
                                  <p className="mt-0.5 text-[11px] text-slate-500">
                                    {d.account_name} • {d.location_city}
                                  </p>
                                  <p className="mt-2 font-mono text-xs font-extrabold text-slate-900">
                                    {formatMoney(d.estimated_value, currency, true)}
                                  </p>
                                  <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2">
                                    <span className="text-[10px] font-semibold text-emerald-700">
                                      Fisik: {d.physical_progress}%
                                    </span>
                                    {nextStage && (
                                      <button
                                        type="button"
                                        onClick={() => handleAdvanceDealStage(d, nextStage)}
                                        className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 hover:bg-blue-100"
                                      >
                                        Majukan <ArrowRight className="h-3 w-3" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 text-[11px] uppercase text-slate-500">
                            <th className="pb-2.5 pr-3">Kode & Proyek</th>
                            <th className="pb-2.5 pr-3">Klien & Lokasi</th>
                            <th className="pb-2.5 pr-3">Tahap Saat Ini</th>
                            <th className="pb-2.5 pr-3">Nilai Proyek</th>
                            <th className="pb-2.5 pr-3">Progres Fisik Lapangan</th>
                            <th className="pb-2.5 text-right">Update Cepat</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredDeals.map((d: any) => (
                            <tr key={d.id} className="hover:bg-slate-50">
                              <td className="py-3 pr-3">
                                <div className="font-mono text-[11px] font-bold text-blue-700">
                                  {d.deal_code}
                                </div>
                                <div className="font-bold text-slate-900">{d.project_name}</div>
                              </td>
                              <td className="py-3 pr-3">
                                <div>{d.account_name}</div>
                                <div className="text-[11px] text-slate-500">
                                  {d.location_city}, {d.province_region}
                                </div>
                              </td>
                              <td className="py-3 pr-3 font-mono text-[11px] font-bold">{d.stage}</td>
                              <td className="py-3 pr-3 font-mono font-bold">
                                {formatMoney(d.estimated_value, currency, true)}
                              </td>
                              <td className="py-3 pr-3">
                                <div className="flex items-center gap-2">
                                  <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-200">
                                    <div
                                      className="h-full bg-emerald-600"
                                      style={{ width: `${d.physical_progress}%` }}
                                    />
                                  </div>
                                  <span className="font-mono text-[11px] font-bold">
                                    {d.physical_progress}%
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 text-right">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateDealProgress(
                                      d.id,
                                      Math.min(100, Number(d.physical_progress) + 15)
                                    )
                                  }
                                  className="rounded-lg border border-slate-300 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100"
                                >
                                  +15% Progres
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* MODULE 4: ACCOUNTS, KYC, CPQ & CONTRACTS */}
              {activeTab === 'accounts' && (
                <AccountsKycContractsView
                  data={data}
                  activeRole={activeRoleProfile}
                  lang={lang}
                  currency={currency}
                  onRefresh={fetchBootstrap}
                  notify={notify}
                />
              )}

              {/* MODULE 5: MILESTONE BILLING & DIGITAL BAST */}
              {activeTab === 'billing' && (
                <BillingAndBastView
                  data={data}
                  activeRole={activeRoleProfile}
                  lang={lang}
                  currency={currency}
                  onRefresh={fetchBootstrap}
                  notify={notify}
                />
              )}

              {/* MODULE 6: AFTER-SALES SLA & GOVERNANCE */}
              {activeTab === 'governance' && (
                <SlaAndGovernanceView
                  data={data}
                  activeRole={activeRoleProfile}
                  lang={lang}
                  currency={currency}
                  onRefresh={fetchBootstrap}
                  notify={notify}
                />
              )}

              {/* MODULE 7: CORPORATE GOVERNANCE DOCS & TEMPLATES */}
              {activeTab === 'docs' && <CorporateDocsPanel />}
            </>
          )}
        </main>
      </div>

      {/* Ctrl+K Global Command Modal */}
      <CommandModal
        open={commandOpen}
        onClose={() => setCommandOpen(false)}
        items={searchableItems}
        onSelect={(tab) => setActiveTab(tab as ActiveTab)}
      />
    </div>
  );
}
