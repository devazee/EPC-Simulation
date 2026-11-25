'use client';

import React, { useMemo, useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Unlock,
  Calculator,
  CheckCircle2,
  XCircle,
  FileSignature,
  Stamp,
  Receipt,
  ClipboardCheck,
  MapPin,
  LifeBuoy,
  History,
  AlertTriangle,
} from 'lucide-react';
import {
  calculateQuotationAndApproval,
  PPH_SCHEMES,
  PphScheme,
  ROLE_PROFILES,
  RoleProfile,
  UserRole,
} from '@/lib/governance';
import {
  DisplayCurrency,
  formatDateTimeId,
  formatMoney,
  getSlaRemainingLabel,
  Lang,
} from '@/lib/formatters';

/* eslint-disable @typescript-eslint/no-explicit-any */

interface CommonPanelProps {
  data: any;
  activeRole: RoleProfile;
  lang: Lang;
  currency: DisplayCurrency;
  onRefresh: () => Promise<void>;
  notify: (type: 'ok' | 'err', msg: string) => void;
}

export function AccountsKycContractsView({
  data,
  activeRole,
  lang,
  currency,
  onRefresh,
  notify,
}: CommonPanelProps) {
  const [subTab, setSubTab] = useState<'kyc' | 'cpq' | 'contracts'>('cpq');
  const [busy, setBusy] = useState(false);

  // Account KYC form state
  const [entityName, setEntityName] = useState('');
  const [accountType, setAccountType] = useState('BUMN_KORPORASI');
  const [industrySector, setIndustrySector] = useState('Energi & Infrastruktur EPC');
  const [picName, setPicName] = useState('');
  const [picRole, setPicRole] = useState('VP Procurement');
  const [picEmail, setPicEmail] = useState('');
  const [picPhone, setPicPhone] = useState('+62811');
  const [nik16, setNik16] = useState('');
  const [npwp16, setNpwp16] = useState('');
  const [nib13, setNib13] = useState('');
  const [cityProvince, setCityProvince] = useState('Jakarta Selatan, DKI Jakarta (WIB)');
  const [pdpAccountConsent, setPdpAccountConsent] = useState(true);

  // CPQ form state
  const [dealId, setDealId] = useState<string>(String(data.deals?.[0]?.id || ''));
  const [boqSummary, setBoqSummary] = useState('');
  const [subtotalDpp, setSubtotalDpp] = useState<string>('25000000000');
  const [discountPct, setDiscountPct] = useState<string>('4.5');
  const [ppnRate, setPpnRate] = useState<number>(11);
  const [pphScheme, setPphScheme] = useState<PphScheme>('PPH_FINAL_EPC_265');
  const [termDeviationDays, setTermDeviationDays] = useState<string>('0');
  const [approvalNotes, setApprovalNotes] = useState('');

  // Contract form state
  const [selectedQuoteId, setSelectedQuoteId] = useState<string>('');
  const [contractType, setContractType] = useState('KONTRAK_EPC');
  const [psreProvider, setPsreProvider] = useState('PERURI_SIGN');

  const liveCalc = useMemo(
    () =>
      calculateQuotationAndApproval({
        subtotalDpp: Number(subtotalDpp || 0),
        discountPct: Number(discountPct || 0),
        ppnRate,
        pphScheme,
        termDeviationDays: Number(termDeviationDays || 0),
      }),
    [subtotalDpp, discountPct, ppnRate, pphScheme, termDeviationDays]
  );

  const approvedQuotesWithoutContract = useMemo(() => {
    const contractedQuoteIds = new Set((data.contracts || []).map((c: any) => Number(c.quote_id)));
    return (data.quotations || []).filter(
      (q: any) =>
        (q.approval_status === 'APPROVED' || q.approval_status === 'AUTO_APPROVED') &&
        !contractedQuoteIds.has(Number(q.id))
    );
  }, [data.quotations, data.contracts]);

  async function handleCreateAccount(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch('/api/crm/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actorRole: activeRole.role,
          entityName,
          accountType,
          industrySector,
          picName,
          picRole,
          picEmail,
          picPhone,
          nik16,
          npwp16,
          nib13,
          cityProvince,
          pdpConsent: pdpAccountConsent,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal menyimpan KYC');
      notify('ok', `Akun ${json.account.account_code} berhasil didaftarkan ke Brankas KYC.`);
      setEntityName('');
      setPicName('');
      setPicEmail('');
      setNik16('');
      setNpwp16('');
      setNib13('');
      await onRefresh();
    } catch (err: any) {
      notify('err', err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleVerifyKyc(accountId: number, status: 'VERIFIED' | 'REJECTED') {
    setBusy(true);
    try {
      const res = await fetch('/api/crm/accounts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actorRole: activeRole.role, accountId, status }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      notify('ok', `Status KYC diperbarui menjadi ${status}.`);
      await onRefresh();
    } catch (err: any) {
      notify('err', err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateQuote(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch('/api/crm/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actorRole: activeRole.role,
          dealId: Number(dealId || data.deals?.[0]?.id),
          boqSummary,
          subtotalDpp: Number(subtotalDpp),
          discountPct: Number(discountPct),
          ppnRate,
          pphScheme,
          termDeviationDays: Number(termDeviationDays),
          approvalNotes,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      notify(
        'ok',
        `Quotation ${json.quotation.quote_number} berhasil dibuat (${json.quotation.approval_status}).`
      );
      setBoqSummary('');
      setApprovalNotes('');
      await onRefresh();
    } catch (err: any) {
      notify('err', err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleApproveQuote(quoteId: number, decision: 'APPROVED' | 'REJECTED') {
    setBusy(true);
    try {
      const res = await fetch('/api/crm/quotations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actorRole: activeRole.role, quoteId, decision }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      notify('ok', `Keputusan otorisasi (${decision}) berhasil dicatat pada Audit Trail.`);
      await onRefresh();
    } catch (err: any) {
      notify('err', err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleIssueContract(e: React.FormEvent) {
    e.preventDefault();
    const targetQuoteId = Number(selectedQuoteId || approvedQuotesWithoutContract[0]?.id);
    if (!targetQuoteId) {
      notify('err', 'Pilih Quotation berstatus APPROVED terlebih dahulu.');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/crm/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actorRole: activeRole.role,
          quoteId: targetQuoteId,
          contractType,
          psreProvider,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      notify(
        'ok',
        `Kontrak Digital ${json.contract.contract_number} + e-Meterai PERURI & Invoice DP 20% berhasil diterbitkan!`
      );
      await onRefresh();
    } catch (err: any) {
      notify('err', err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Sub-navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSubTab('cpq')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              subTab === 'cpq'
                ? 'bg-blue-700 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Calculator className="h-4 w-4" />
            {lang === 'ID'
              ? 'CPQ, Pajak Coretax & Multi-Tier Approval'
              : 'CPQ, Coretax Engine & Tiered Approval'}
          </button>
          <button
            type="button"
            onClick={() => setSubTab('kyc')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              subTab === 'kyc'
                ? 'bg-blue-700 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            {lang === 'ID' ? 'Brankas KYC & Masking UU PDP' : 'KYC Vault & PDP Masking'}
          </button>
          <button
            type="button"
            onClick={() => setSubTab('contracts')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              subTab === 'contracts'
                ? 'bg-blue-700 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <FileSignature className="h-4 w-4" />
            {lang === 'ID' ? 'Kontrak Digital, e-Meterai & PSrE' : 'Digital Contracts, e-Meterai & PSrE'}
          </button>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs">
          {activeRole.canViewUnmaskedKyc ? (
            <>
              <Unlock className="h-3.5 w-3.5 text-emerald-600" />
              <span className="font-semibold text-emerald-800">
                UU PDP Clearance Aktif (NIK/NPWP Penuh)
              </span>
            </>
          ) : (
            <>
              <Lock className="h-3.5 w-3.5 text-amber-600" />
              <span className="font-semibold text-amber-800">
                UU PDP Field Masking Aktif ({activeRole.role})
              </span>
            </>
          )}
        </div>
      </div>

      {/* SUBTAB 1: CPQ & APPROVAL MATRIX */}
      {subTab === 'cpq' && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <form
            onSubmit={handleCreateQuote}
            className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-5"
          >
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                Generator Penawaran (CPQ / BoQ) & Pajak Coretax DJP
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Otomatis menghitung PPN, PPh Konstruksi/Properti, dan level eskalasi diskon korporasi.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Proyek / Deal Aktif</label>
              <select
                value={dealId}
                onChange={(e) => setDealId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900"
              >
                {(data.deals || []).map((d: any) => (
                  <option key={d.id} value={d.id}>
                    {d.deal_code} — {d.project_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Ringkasan Lingkup BoQ / Skema Pembayaran
              </label>
              <textarea
                rows={2}
                required
                value={boqSummary}
                onChange={(e) => setBoqSummary(e.target.value)}
                placeholder="Contoh: Paket Engineering, Procurement & Construction Gardu Induk + Retensi 5%..."
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Nilai DPP Awal (IDR)</label>
                <input
                  type="number"
                  min={1000000}
                  step={1000000}
                  value={subtotalDpp}
                  onChange={(e) => setSubtotalDpp(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">Pengajuan Diskon (%)</label>
                <input
                  type="number"
                  min={0}
                  max={40}
                  step={0.5}
                  value={discountPct}
                  onChange={(e) => setDiscountPct(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 font-mono text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Tarif PPN</label>
                <select
                  value={ppnRate}
                  onChange={(e) => setPpnRate(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs"
                >
                  <option value={11}>PPN Efektif Umum (11%)</option>
                  <option value={12}>PPN Tarif Baru / Barang Mewah (12%)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">Deviasi Jatuh Tempo (Hari)</label>
                <input
                  type="number"
                  min={0}
                  max={90}
                  value={termDeviationDays}
                  onChange={(e) => setTermDeviationDays(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 font-mono text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Skema Pemotongan PPh (Coretax)</label>
              <select
                value={pphScheme}
                onChange={(e) => setPphScheme(e.target.value as PphScheme)}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs"
              >
                {Object.entries(PPH_SCHEMES).map(([k, v]) => (
                  <option key={k} value={k}>
                    {lang === 'ID' ? v.labelId : v.labelEn}
                  </option>
                ))}
              </select>
            </div>

            {/* Live Calculation Preview Box */}
            <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3.5 text-xs space-y-1.5">
              <div className="flex justify-between text-slate-600">
                <span>DPP Setelah Diskon ({liveCalc.discountPct}%):</span>
                <span className="font-mono font-semibold text-slate-900">
                  {formatMoney(liveCalc.netDpp, currency)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>PPN ({liveCalc.ppnRate}%):</span>
                <span className="font-mono font-semibold text-slate-900">
                  + {formatMoney(liveCalc.ppnAmount, currency)}
                </span>
              </div>
              <div className="flex justify-between border-t border-blue-200 pt-1.5 font-bold text-slate-900">
                <span>Total Nilai Kontrak Bruto (Gross):</span>
                <span className="font-mono text-blue-800">
                  {formatMoney(liveCalc.grandTotalGross, currency)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Potongan PPh ({liveCalc.pphRate}%):</span>
                <span className="font-mono text-rose-700">
                  - {formatMoney(liveCalc.pphAmount, currency)}
                </span>
              </div>
              <div className="flex justify-between text-emerald-900 font-semibold">
                <span>Estimasi Kas Bersih Diterima:</span>
                <span className="font-mono">{formatMoney(liveCalc.netCashReceivable, currency)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between rounded-lg bg-white px-2.5 py-1.5 border border-blue-200">
                <span className="font-semibold text-slate-700">Jalur Otorisasi Wajib:</span>
                <span className="rounded-md bg-blue-700 px-2 py-0.5 font-mono text-[11px] font-bold text-white">
                  {liveCalc.requiredLevel === 0
                    ? 'Level 0 — Otomatis'
                    : liveCalc.requiredLevel === 1
                    ? 'Level 1 — Manager (SLA 4j)'
                    : liveCalc.requiredLevel === 2
                    ? 'Level 2 — VP Divisi (SLA 8j)'
                    : 'Level 3 — Direksi (SLA 24j)'}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-blue-700 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-800 disabled:opacity-50"
            >
              {busy ? 'Memproses...' : 'Simpan Quotation & Jalankan Workflow Otorisasi'}
            </button>
          </form>

          {/* Quotations & Multi-Tier Approval Queue */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-7">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Daftar Quotation & Matriks Persetujuan Berjenjang (Level 0 – Level 3)
                </h3>
                <p className="text-xs text-slate-500">
                  Wewenang peran aktif Anda ({activeRole.labelId}): Maksimal Persetujuan{' '}
                  <strong>Level {activeRole.approvalMaxLevel}</strong>.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {(data.quotations || []).map((q: any) => {
                const isPending = String(q.approval_status).startsWith('PENDING_');
                const canApproveThis =
                  isPending && activeRole.approvalMaxLevel >= Number(q.required_approval_level);

                return (
                  <div
                    key={q.id}
                    className="rounded-xl border border-slate-200 p-4 transition hover:border-slate-300"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-blue-700">
                            {q.quote_number}
                          </span>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                              q.approval_status === 'APPROVED' || q.approval_status === 'AUTO_APPROVED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : q.approval_status === 'REJECTED'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-900'
                            }`}
                          >
                            {q.approval_status} (L{q.required_approval_level})
                          </span>
                        </div>
                        <p className="mt-1 text-xs font-bold text-slate-900">{q.project_name}</p>
                        <p className="mt-0.5 text-xs text-slate-600">{q.boq_summary}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-sm font-extrabold text-slate-900">
                          {formatMoney(q.grand_total_gross, currency, true)}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Diskon {q.discount_pct}% • PPN {q.ppn_rate}% • PPh {q.pph_rate}%
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2.5 text-[11px] text-slate-500">
                      <span>
                        Diajukan: <strong>{q.requested_by}</strong>
                        {q.approved_by ? ` • Disahkan: ${q.approved_by}` : ` • Target SLA: ${q.sla_hours} Jam`}
                      </span>

                      {isPending && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => handleApproveQuote(q.id, 'APPROVED')}
                            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold ${
                              canApproveThis
                                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                            }`}
                            title={
                              canApproveThis
                                ? 'Setujui pengajuan ini'
                                : `Ganti peran ke minimal Level ${q.required_approval_level} untuk menyetujui`
                            }
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Approve L{q.required_approval_level}
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => handleApproveQuote(q.id, 'REJECTED')}
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-300 bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 hover:bg-rose-100"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Tolak
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: KYC VAULT & UU PDP MASKING */}
      {subTab === 'kyc' && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <form
            onSubmit={handleCreateAccount}
            className="space-y-3.5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-5"
          >
            <h3 className="text-sm font-bold text-slate-900">
              Registrasi Entitas Klien & Dokumen KYC Indonesia
            </h3>
            <p className="text-xs text-slate-500">
              Validasi ketat NIK 16 digit, NPWP 16 digit (Coretax), NIB OSS 13 digit & Consent UU PDP.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Nama Badan Hukum / Klien</label>
              <input
                type="text"
                required
                value={entityName}
                onChange={(e) => setEntityName(e.target.value)}
                placeholder="PT Contoh Karya Infrastruktur Tbk"
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Kategori Klien</label>
                <select
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs"
                >
                  <option value="BUMN_KORPORASI">BUMN / Anak Usaha BUMN</option>
                  <option value="SWASTA_TBK">Korporasi Publik (Tbk) / Swasta</option>
                  <option value="INDIVIDU_HNWI">Individu / Investor Kawasan</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">Sektor Industri</label>
                <input
                  type="text"
                  value={industrySector}
                  onChange={(e) => setIndustrySector(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Nama Pejabat / PIC</label>
                <input
                  type="text"
                  required
                  value={picName}
                  onChange={(e) => setPicName(e.target.value)}
                  placeholder="Ir. Budi Hartono"
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">Email Resmi PIC</label>
                <input
                  type="email"
                  required
                  value={picEmail}
                  onChange={(e) => setPicEmail(e.target.value)}
                  placeholder="budi@korporasi.co.id"
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700">NIK (16 Digit)</label>
                <input
                  type="text"
                  required
                  maxLength={16}
                  value={nik16}
                  onChange={(e) => setNik16(e.target.value.replace(/\D/g, ''))}
                  placeholder="3174010101800001"
                  className="mt-1 w-full rounded-xl border border-slate-300 px-2.5 py-2 font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700">NPWP (16 Digit)</label>
                <input
                  type="text"
                  required
                  maxLength={16}
                  value={npwp16}
                  onChange={(e) => setNpwp16(e.target.value.replace(/\D/g, ''))}
                  placeholder="0123456789010000"
                  className="mt-1 w-full rounded-xl border border-slate-300 px-2.5 py-2 font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700">NIB OSS (13 Digit)</label>
                <input
                  type="text"
                  required
                  maxLength={13}
                  value={nib13}
                  onChange={(e) => setNib13(e.target.value.replace(/\D/g, ''))}
                  placeholder="9120304050607"
                  className="mt-1 w-full rounded-xl border border-slate-300 px-2.5 py-2 font-mono text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Telepon / WhatsApp</label>
                <input
                  type="text"
                  value={picPhone}
                  onChange={(e) => setPicPhone(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">Domisili & Zona Waktu</label>
                <input
                  type="text"
                  value={cityProvince}
                  onChange={(e) => setCityProvince(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
                />
              </div>
            </div>

            <label className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
              <input
                type="checkbox"
                checked={pdpAccountConsent}
                onChange={(e) => setPdpAccountConsent(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600"
              />
              <span>
                <strong>Explicit Consent UU No. 27/2022 (UU PDP):</strong> Subjek data telah menyetujui pemrosesan NIK, NPWP, dan dokumen legal untuk keperluan kontrak & perpajakan.
              </span>
            </label>

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-blue-700 py-2.5 text-xs font-bold text-white hover:bg-blue-800 disabled:opacity-50"
            >
              Simpan ke Brankas KYC Terenkripsi
            </button>
          </form>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-7">
            <h3 className="text-sm font-bold text-slate-900">
              Daftar Akun Korporasi & Status Verifikasi KYC
            </h3>
            <p className="mb-4 text-xs text-slate-500">
              Beralihlah ke peran <strong>Legal, Tax & Finance</strong> atau <strong>Direksi</strong> pada pengalih peran di bagian atas layar untuk membuka masking NIK/NPWP dan memvalidasi KYC.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500">
                    <th className="pb-2.5 pr-3">Kode & Entitas</th>
                    <th className="pb-2.5 pr-3">NIK & NPWP 16 Digit</th>
                    <th className="pb-2.5 pr-3">NIB OSS</th>
                    <th className="pb-2.5 pr-3">Status KYC</th>
                    <th className="pb-2.5 text-right">Tindakan Legal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(data.accounts || []).map((acc: any) => (
                    <tr key={acc.id} className="hover:bg-slate-50/80">
                      <td className="py-3 pr-3">
                        <div className="font-mono text-[11px] font-bold text-blue-700">
                          {acc.account_code}
                        </div>
                        <div className="font-bold text-slate-900">{acc.entity_name}</div>
                        <div className="text-[11px] text-slate-500">
                          {acc.pic_name} • {acc.city_province}
                        </div>
                      </td>
                      <td className="py-3 pr-3 font-mono text-[11px]">
                        <div>NIK: {acc.nik_display}</div>
                        <div className="text-slate-600">NPWP: {acc.npwp_display}</div>
                      </td>
                      <td className="py-3 pr-3 font-mono text-[11px] text-slate-700">{acc.nib_13}</td>
                      <td className="py-3 pr-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                            acc.kyc_status === 'VERIFIED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : acc.kyc_status === 'REJECTED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {acc.kyc_status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        {acc.kyc_status !== 'VERIFIED' ? (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => handleVerifyKyc(acc.id, 'VERIFIED')}
                            className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-700"
                          >
                            Verifikasi KYC
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400">Tervalidasi</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: DIGITAL CONTRACTS, E-METERAI & PSRE */}
      {subTab === 'contracts' && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <form
            onSubmit={handleIssueContract}
            className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-5"
          >
            <div className="flex items-center gap-2">
              <Stamp className="h-5 w-5 text-blue-700" />
              <h3 className="text-sm font-bold text-slate-900">
                Penerbitan SPK / Kontrak EPC / PPJB + e-Meterai PERURI
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Hanya Quotation berstatus <strong>APPROVED</strong> dengan klien <strong>KYC VERIFIED</strong> yang dapat diterbitkan menjadi kontrak sah dan memicu tagihan DP 20% otomatis.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Pilih Quotation yang Telah Disetujui
              </label>
              <select
                value={selectedQuoteId}
                onChange={(e) => setSelectedQuoteId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs"
              >
                {approvedQuotesWithoutContract.length === 0 ? (
                  <option value="">(Semua Quotation APPROVED sudah memiliki Kontrak)</option>
                ) : (
                  approvedQuotesWithoutContract.map((q: any) => (
                    <option key={q.id} value={q.id}>
                      {q.quote_number} — {q.project_name} ({formatMoney(q.grand_total_gross, currency, true)})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Jenis Instrumen Hukum</label>
                <select
                  value={contractType}
                  onChange={(e) => setContractType(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs"
                >
                  <option value="KONTRAK_EPC">Kontrak Induk EPC (FIDIC/LPJK)</option>
                  <option value="SPK_PENGADAAN">Surat Perintah Kerja (SPK)</option>
                  <option value="PPJB_NOTARIS">PPJB Kawasan / Properti MPC</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">Penyelenggara TTE PSrE</label>
                <select
                  value={psreProvider}
                  onChange={(e) => setPsreProvider(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs"
                >
                  <option value="PERURI_SIGN">Peruri Sign (PSrE BUMN)</option>
                  <option value="PRIVY_ID">PrivyID (PSrE Komdigi)</option>
                  <option value="VIDA_SIGN">VIDA Sign (PSrE Komdigi)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={busy || approvedQuotesWithoutContract.length === 0}
              className="w-full rounded-xl bg-blue-700 py-2.5 text-xs font-bold text-white hover:bg-blue-800 disabled:opacity-50"
            >
              Bubuhkan e-Meterai Rp10.000 & Terbitkan Kontrak Digital
            </button>
          </form>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-7">
            <h3 className="mb-4 text-sm font-bold text-slate-900">
              Registri Kontrak Aktif, Nomor Seri e-Meterai PERURI & Status PSrE
            </h3>
            <div className="space-y-3">
              {(data.contracts || []).map((c: any) => (
                <div key={c.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-xs font-bold text-blue-700">
                        {c.contract_number}
                      </span>
                      <h4 className="mt-0.5 text-xs font-bold text-slate-900">{c.project_name}</h4>
                      <p className="text-[11px] text-slate-500">{c.account_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm font-extrabold text-slate-900">
                        {formatMoney(c.contract_value, currency, true)}
                      </p>
                      <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                        {c.sign_status} • {c.psre_provider}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2 font-mono text-[11px] text-slate-600">
                    <span>e-Meterai: {c.emeterai_serial}</span>
                    <span>Retensi Jaminan Pemeliharaan: {c.retention_pct}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function BillingAndBastView({
  data,
  activeRole,
  currency,
  onRefresh,
  notify,
}: CommonPanelProps) {
  const [busy, setBusy] = useState(false);
  const [dealId, setDealId] = useState<string>(String(data.deals?.[0]?.id || ''));
  const [clientRepName, setClientRepName] = useState('');
  const [checklistPassed, setChecklistPassed] = useState<number>(25);
  const [geotagCoords, setGeotagCoords] = useState('-6.3016, 107.1538 (Kawasan Industri Cikarang)');
  const [retentionDays, setRetentionDays] = useState<number>(180);
  const [defectNotes, setDefectNotes] = useState(
    'Pengujian beban penuh (full-load commissioning), fungsi proteksi keselamatan & kelengkapan As-Built Drawing dinyatakan lulus.'
  );

  async function handleReconcilePaid(billingId: number) {
    setBusy(true);
    try {
      const res = await fetch('/api/crm/billings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actorRole: activeRole.role, billingId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      notify('ok', 'Pembayaran Virtual Account SNAP BI berhasil direkonsiliasi sebagai PAID.');
      await onRefresh();
    } catch (err: any) {
      notify('err', err.message);
    } finally {
      setBusy(false);
    }
  }

  function handleCaptureBrowserGps() {
    if (!navigator.geolocation) {
      notify('err', 'Peramban tidak mendukung Geolocation API.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeotagCoords(
          `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)} (GPS Live Verified)`
        );
        notify('ok', 'Koordinat lokasi GPS lapangan berhasil direkam.');
      },
      () => {
        notify('err', 'Izin lokasi ditolak — menggunakan titik koordinat site proyek.');
      }
    );
  }

  async function handleCreateBast(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch('/api/crm/bast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actorRole: activeRole.role,
          dealId: Number(dealId || data.deals?.[0]?.id),
          clientRepName,
          checklistPassed,
          geotagCoords,
          retentionDays,
          defectNotes,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      notify('ok', `BAST Digital ${json.bast.bast_number} berhasil diterbitkan & masa retensi dimulai!`);
      setClientRepName('');
      await onRefresh();
    } catch (err: any) {
      notify('err', err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Milestone Billing Table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-blue-700" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Jadwal Penagihan Termin (Monthly Certificate / Angsuran) & Rekonsiliasi VA SNAP BI
              </h3>
              <p className="text-xs text-slate-500">
                Sinkronisasi otomatis nomor dokumen jurnal piutang SAP S/4HANA FI & potongan pajak PPN/PPh.
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500">
                <th className="pb-2.5 pr-3">No. Invoice & ERP Ref</th>
                <th className="pb-2.5 pr-3">Proyek & Termin</th>
                <th className="pb-2.5 pr-3">Virtual Account SNAP BI</th>
                <th className="pb-2.5 pr-3">Total Tagihan (Inc. PPN)</th>
                <th className="pb-2.5 pr-3">Jatuh Tempo</th>
                <th className="pb-2.5 pr-3">Status</th>
                <th className="pb-2.5 text-right">Rekonsiliasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(data.billings || []).map((b: any) => (
                <tr key={b.id} className="hover:bg-slate-50">
                  <td className="py-3 pr-3">
                    <div className="font-mono font-bold text-blue-700">{b.invoice_number}</div>
                    <div className="font-mono text-[11px] text-slate-500">{b.erp_sync_ref}</div>
                  </td>
                  <td className="py-3 pr-3">
                    <div className="font-bold text-slate-900">{b.term_name}</div>
                    <div className="text-[11px] text-slate-500">{b.project_name}</div>
                  </td>
                  <td className="py-3 pr-3 font-mono text-[11px] text-slate-700">{b.snap_va_number}</td>
                  <td className="py-3 pr-3">
                    <div className="font-mono font-bold text-slate-900">
                      {formatMoney(b.total_invoice, currency)}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      PPh Dipotong: {formatMoney(b.pph_withheld, currency, true)}
                    </div>
                  </td>
                  <td className="py-3 pr-3 font-mono text-[11px] text-slate-700">
                    {String(b.due_date).slice(0, 10)}
                  </td>
                  <td className="py-3 pr-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        b.payment_status === 'PAID'
                          ? 'bg-emerald-100 text-emerald-800'
                          : b.payment_status === 'OVERDUE'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      {b.payment_status}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    {b.payment_status !== 'PAID' ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleReconcilePaid(b.id)}
                        className="rounded-lg bg-blue-700 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-blue-800"
                      >
                        Tandai PAID
                      </button>
                    ) : (
                      <span className="text-[11px] font-semibold text-emerald-700">Terbayar</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Digital BAST Field Form & Records */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <form
          onSubmit={handleCreateBast}
          className="space-y-3.5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-5"
        >
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-emerald-700" />
            <h3 className="text-sm font-bold text-slate-900">
              Inspeksi Lapangan & Penerbitan BAST Digital (Geotag)
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Dapat diakses oleh <strong>Project Manager</strong> atau <strong>Direksi</strong> menggunakan tablet/ponsel di lokasi proyek.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Pilih Proyek Serah Terima</label>
            <select
              value={dealId}
              onChange={(e) => setDealId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs"
            >
              {(data.deals || []).map((d: any) => (
                <option key={d.id} value={d.id}>
                  {d.deal_code} — {d.project_name} ({d.physical_progress}%)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Pejabat Perwakilan Klien Penandatangan BAST
            </label>
            <input
              type="text"
              required
              value={clientRepName}
              onChange={(e) => setClientRepName(e.target.value)}
              placeholder="Contoh: Dr. Kevin Tanoto (Chief Infrastructure Officer)"
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Skor Checklist Lulus (Dari 25)
              </label>
              <input
                type="number"
                min={1}
                max={25}
                value={checklistPassed}
                onChange={(e) => setChecklistPassed(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 font-mono text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Masa Retensi / Garansi</label>
              <select
                value={retentionDays}
                onChange={(e) => setRetentionDays(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs"
              >
                <option value={90}>90 Hari Kalender (3 Bulan)</option>
                <option value={180}>180 Hari Kalender (6 Bulan Standar EPC)</option>
                <option value={365}>365 Hari Kalender (12 Bulan Struktur)</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700">Koordinat Geotag Lokasi</label>
              <button
                type="button"
                onClick={handleCaptureBrowserGps}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:underline"
              >
                <MapPin className="h-3 w-3" /> Ambil GPS Perangkat
              </button>
            </div>
            <input
              type="text"
              value={geotagCoords}
              onChange={(e) => setGeotagCoords(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Catatan Inspeksi Bersama</label>
            <textarea
              rows={2}
              value={defectNotes}
              onChange={(e) => setDefectNotes(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
            />
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-emerald-700 py-2.5 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-50"
          >
            Terbitkan BAST Digital Bertanda Tangan PSrE
          </button>
        </form>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-7">
          <h3 className="mb-4 text-sm font-bold text-slate-900">
            Arsip Berita Acara Serah Terima (BAST) & Pelacak Masa Retensi Aktif
          </h3>
          <div className="space-y-3">
            {(data.bastRecords || []).map((r: any) => (
              <div key={r.id} className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-xs font-bold text-emerald-800">
                      {r.bast_number}
                    </span>
                    <h4 className="mt-0.5 text-xs font-bold text-slate-900">{r.project_name}</h4>
                    <p className="mt-1 text-xs text-slate-600">{r.defect_notes}</p>
                  </div>
                  <span className="rounded-full bg-emerald-700 px-2.5 py-0.5 text-[11px] font-bold text-white">
                    Checklist {r.checklist_passed}/{r.checklist_total} LULUS
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-1 gap-2 border-t border-emerald-200/70 pt-2.5 text-[11px] text-slate-600 sm:grid-cols-3">
                  <div>
                    <strong>Inspektor & Klien:</strong> {r.inspector_name} / {r.client_rep_name}
                  </div>
                  <div className="font-mono">
                    <strong>Geotag:</strong> {r.geotag_coords}
                  </div>
                  <div>
                    <strong>Akhir Retensi ({r.retention_days}h):</strong>{' '}
                    <span className="font-mono font-bold text-emerald-900">
                      {String(r.retention_end_date).slice(0, 10)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SlaAndGovernanceView({
  data,
  activeRole,
  lang,
  onRefresh,
  notify,
}: CommonPanelProps) {
  const [busy, setBusy] = useState(false);
  const [dealId, setDealId] = useState<string>(String(data.deals?.[0]?.id || ''));
  const [reporterName, setReporterName] = useState('');
  const [category, setCategory] = useState('MEP_ELECTRICAL');
  const [priority, setPriority] = useState('HIGH');
  const [subject, setSubject] = useState('');

  async function handleCreateTicket(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch('/api/crm/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actorRole: activeRole.role,
          dealId: Number(dealId || data.deals?.[0]?.id),
          reporterName,
          category,
          priority,
          subject,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      notify('ok', `Tiket SLA ${json.ticket.ticket_number} berhasil dibuka.`);
      setReporterName('');
      setSubject('');
      await onRefresh();
    } catch (err: any) {
      notify('err', err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleResolveTicket(ticketId: number) {
    setBusy(true);
    try {
      const res = await fetch('/api/crm/tickets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actorRole: activeRole.role, ticketId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      notify('ok', 'Tiket masa retensi berhasil diselesaikan (RESOLVED).');
      await onRefresh();
    } catch (err: any) {
      notify('err', err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* ITIL v4 SLA Ticketing */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <form
          onSubmit={handleCreateTicket}
          className="space-y-3.5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-4"
        >
          <div className="flex items-center gap-2">
            <LifeBuoy className="h-5 w-5 text-blue-700" />
            <h3 className="text-sm font-bold text-slate-900">
              Helpdesk Masa Retensi & SLA (ITIL v4)
            </h3>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700">Proyek / Kawasan</label>
            <select
              value={dealId}
              onChange={(e) => setDealId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs"
            >
              {(data.deals || []).map((d: any) => (
                <option key={d.id} value={d.id}>
                  {d.deal_code} — {d.project_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700">Nama Pelapor Klien</label>
            <input
              type="text"
              required
              value={reporterName}
              onChange={(e) => setReporterName(e.target.value)}
              placeholder="Kepala Operasi Fasilitas"
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700">Kategori Teknis</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs"
              >
                <option value="MEP_ELECTRICAL">MEP & Kelistrikan</option>
                <option value="STRUCTURAL_CIVIL">Sipil & Struktur</option>
                <option value="HVAC_PIPING">Perpipaan & HVAC</option>
                <option value="DOCUMENT_ADMIN">Dokumen As-Built</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Prioritas SLA</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs"
              >
                <option value="CRITICAL">CRITICAL (SLA 4 Jam)</option>
                <option value="HIGH">HIGH (SLA 8 Jam)</option>
                <option value="MEDIUM">MEDIUM (SLA 16 Jam)</option>
                <option value="LOW">LOW (SLA 24 Jam)</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700">Deskripsi Temuan / Keluhan</label>
            <textarea
              rows={2}
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Jelaskan detail gangguan teknis pada masa retensi..."
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-blue-700 py-2.5 text-xs font-bold text-white hover:bg-blue-800 disabled:opacity-50"
          >
            Buka Tiket Komplain Ber-SLA
          </button>
        </form>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-8">
          <h3 className="mb-4 text-sm font-bold text-slate-900">
            Antrean Tiket Purna Jual & Penghitung Mundur SLA
          </h3>
          <div className="space-y-3">
            {(data.slaTickets || []).map((t: any) => {
              const sla = getSlaRemainingLabel(t.sla_deadline, t.status, lang);
              return (
                <div key={t.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-blue-700">
                          {t.ticket_number}
                        </span>
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                          {t.priority} • {t.category}
                        </span>
                      </div>
                      <p className="mt-1 text-xs font-bold text-slate-900">{t.subject}</p>
                      <p className="text-[11px] text-slate-500">
                        {t.project_name} • Pelapor: {t.reporter_name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                          sla.tone === 'ok'
                            ? 'bg-emerald-100 text-emerald-800'
                            : sla.tone === 'warn'
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {sla.tone === 'breach' && <AlertTriangle className="h-3 w-3" />}
                        {sla.text}
                      </span>
                      {t.status !== 'RESOLVED' && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleResolveTicket(t.id)}
                          className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-700"
                        >
                          Resolve
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* RBAC Matrix Reference */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-bold text-slate-900">
          Matriks Hak Akses Korporasi (RBAC — Segregation of Duties ISO/IEC 27001:2022)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] uppercase text-slate-500">
                <th className="pb-2 pr-3">Kode Peran</th>
                <th className="pb-2 pr-3">Pejabat Simulasi</th>
                <th className="pb-2 pr-3">Level Approval</th>
                <th className="pb-2 pr-3">Buka Masking UU PDP</th>
                <th className="pb-2 pr-3">Validasi KYC & Pajak</th>
                <th className="pb-2 pr-3">Terbit Kontrak PSrE</th>
                <th className="pb-2">Terbit BAST Digital</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(Object.keys(ROLE_PROFILES) as UserRole[]).map((rk) => {
                const rp = ROLE_PROFILES[rk];
                return (
                  <tr key={rk} className={rk === activeRole.role ? 'bg-blue-50/70 font-semibold' : ''}>
                    <td className="py-2 pr-3 font-mono text-[11px] text-blue-700">{rp.role}</td>
                    <td className="py-2 pr-3">{rp.actorName}</td>
                    <td className="py-2 pr-3">Level {rp.approvalMaxLevel}</td>
                    <td className="py-2 pr-3">{rp.canViewUnmaskedKyc ? 'Ya (Penuh)' : 'Ter-masking'}</td>
                    <td className="py-2 pr-3">{rp.canVerifyKyc ? 'Otorisasi Aktif' : '-'}</td>
                    <td className="py-2 pr-3">{rp.canIssueContract ? 'Otorisasi Aktif' : '-'}</td>
                    <td className="py-2">{rp.canIssueBast ? 'Otorisasi Aktif' : '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Immutable Audit Trail */}
      <div className="rounded-2xl border border-slate-200 bg-slate-950 p-5 text-slate-100 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold text-white">
                Immutable Audit Trail — Pemeriksaan SPI, KAP & Auditor ISO/IEC 27001
              </h3>
              <p className="text-xs text-slate-400">
                Append-only security log di Neon PostgreSQL lengkap dengan hash integritas, aktor, perubahan nilai, dan alamat IP.
              </p>
            </div>
          </div>
          <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 font-mono text-[11px] font-bold text-emerald-300">
            ZERO AUDIT FINDING READY
          </span>
        </div>

        <div className="max-h-96 overflow-y-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-slate-900 text-[11px] uppercase text-slate-400">
              <tr>
                <th className="px-3 py-2.5">Waktu (WIB) & Hash</th>
                <th className="px-3 py-2.5">Aktor & Peran</th>
                <th className="px-3 py-2.5">Aksi & Entitas</th>
                <th className="px-3 py-2.5">Rincian Perubahan (Old → New)</th>
                <th className="px-3 py-2.5">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-mono text-[11px]">
              {(data.auditLogs || []).map((log: any) => (
                <tr key={log.id} className="hover:bg-slate-900/60">
                  <td className="px-3 py-2.5">
                    <div className="text-slate-200">{formatDateTimeId(log.created_at)}</div>
                    <div className="text-[10px] text-emerald-400">{log.log_hash}</div>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="font-sans font-semibold text-white">{log.actor_name}</div>
                    <div className="text-[10px] text-blue-400">{log.actor_role}</div>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="rounded bg-slate-800 px-1.5 py-0.5 text-amber-300">
                      {log.action_type}
                    </span>
                    <div className="mt-0.5 text-slate-300">{log.entity_ref}</div>
                  </td>
                  <td className="px-3 py-2.5 font-sans text-xs text-slate-300">
                    <div>{log.change_summary}</div>
                    {(log.old_value || log.new_value) && (
                      <div className="mt-0.5 font-mono text-[10px] text-slate-400">
                        {log.old_value ? `${log.old_value} → ` : ''}
                        <span className="text-emerald-300">{log.new_value}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-slate-400">{log.ip_address}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
