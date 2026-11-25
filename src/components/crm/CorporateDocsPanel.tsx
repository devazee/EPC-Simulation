'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { FileText, Printer, Copy, Check, ShieldCheck, Building2 } from 'lucide-react';

export interface CorporateDocItem {
  id: string;
  docCode: string;
  title: string;
  phase: string;
  filename: string;
  content: string;
}

export function CorporateDocsPanel() {
  const [docs, setDocs] = useState<CorporateDocItem[]>([]);
  const [selectedId, setSelectedId] = useState<string>('prd');
  const [copied, setCopied] = useState(false);
  const [companyName, setCompanyName] = useState('Nusantara MPC & EPC Infrastruktur Tbk');
  const [pihakPertama, setPihakPertama] = useState('Ir. Haryo Baskoro, M.B.A.');
  const [pihakKedua, setPihakKedua] = useState('Devaro Brahmansyah');
  const [direkturName, setDirekturName] = useState('Ir. Suryo Wibowo');

  useEffect(() => {
    fetch('/api/crm/docs')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.documents)) {
          setDocs(data.documents);
        }
      })
      .catch(() => {});
  }, []);

  const currentDoc = useMemo(
    () => docs.find((d) => d.id === selectedId) || docs[0],
    [docs, selectedId]
  );

  const renderedContent = useMemo(() => {
    if (!currentDoc) return '';
    return currentDoc.content
      .replace(/\[Nama Perusahaan Korporasi\]|\[Nama Perusahaan\]/g, companyName)
      .replace(/\[Nama Pejabat Pihak Pertama\]|\[Nama Lengkap VP Bisnis\]/g, pihakPertama)
      .replace(/\[Nama Pejabat Pihak Kedua\]|\[Nama System Architect\]/g, pihakKedua)
      .replace(/\[Nama Direktur Utama\]|\[Nama Direktur\]/g, direkturName);
  }, [currentDoc, companyName, pihakPertama, pihakKedua, direkturName]);

  const handleCopy = async () => {
    if (!renderedContent) return;
    await navigator.clipboard.writeText(renderedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="no-print rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-blue-700" />
              <h2 className="text-lg font-bold text-slate-900">
                Pusat Perdokumenan & Template Korporasi Besar Indonesia (ISO 9001 / COBIT 2019 / SPI)
              </h2>
            </div>
            <p className="mt-1 text-xs text-slate-600">
              Format penomoran baku korporasi:{' '}
              <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-blue-700">
                [KODE-ENTITAS]/[KODE-DIVISI]/[JENIS-DOK]/[KODE-PROYEK]/[TAHUN]/[NO-URUT]
              </code>
              . Seluruh dokumen tersimpan juga di folder <code className="font-mono">/docs</code> repositori GitHub.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Tersalin!' : 'Salin Dokumen'}
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-800"
            >
              <Printer className="h-4 w-4" />
              Cetak / Simpan PDF Resmi
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Nama Entitas PT (Variabel Otomatis)
            </label>
            <div className="mt-1 flex items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1.5">
              <Building2 className="h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full bg-transparent text-xs text-slate-900 focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Pejabat Pihak Pertama (Pemilik Proyek)
            </label>
            <input
              type="text"
              value={pihakPertama}
              onChange={(e) => setPihakPertama(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-900"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Pejabat Pihak Kedua (Pelaksana TI)
            </label>
            <input
              type="text"
              value={pihakKedua}
              onChange={(e) => setPihakKedua(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-900"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Direktur Pengesah (Executive Sponsor)
            </label>
            <input
              type="text"
              value={direkturName}
              onChange={(e) => setDirekturName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-900"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="no-print space-y-2 lg:col-span-4">
          {docs.map((doc) => {
            const active = currentDoc?.id === doc.id;
            return (
              <button
                key={doc.id}
                type="button"
                onClick={() => setSelectedId(doc.id)}
                className={`w-full rounded-xl border p-3.5 text-left transition ${
                  active
                    ? 'border-blue-600 bg-blue-50/80 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] font-bold text-blue-700">{doc.docCode}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                    {doc.phase}
                  </span>
                </div>
                <div className="mt-1.5 flex items-start gap-2">
                  <FileText className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                  <div>
                    <p className="text-xs font-bold text-slate-900">{doc.title}</p>
                    <p className="mt-0.5 font-mono text-[11px] text-slate-500">/docs/{doc.filename}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="print-sheet rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-8">
          {currentDoc ? (
            <div>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-4">
                <div>
                  <span className="rounded bg-blue-100 px-2 py-0.5 font-mono text-xs font-bold text-blue-800">
                    {currentDoc.docCode}
                  </span>
                  <h3 className="mt-1.5 text-base font-bold text-slate-900">{currentDoc.title}</h3>
                </div>
                <span className="rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-900">
                  RAHASIA / INTERNAL KORPORASI
                </span>
              </div>
              <pre className="max-h-[680px] overflow-y-auto whitespace-pre-wrap rounded-xl bg-slate-50 p-5 font-mono text-xs leading-relaxed text-slate-800 print:max-h-none print:bg-white print:p-0">
                {renderedContent}
              </pre>
            </div>
          ) : (
            <div className="py-16 text-center text-sm text-slate-500">Memuat paket dokumen korporasi...</div>
          )}
        </div>
      </div>
    </div>
  );
}
