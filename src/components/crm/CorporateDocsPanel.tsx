'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  FileText,
  Printer,
  Copy,
  Check,
  ShieldCheck,
  Building2,
  Eye,
  Code2,
  Stamp,
} from 'lucide-react';

export interface CorporateDocItem {
  id: string;
  docCode: string;
  title: string;
  phase: string;
  filename: string;
  content: string;
}

interface ParsedBlock {
  type: 'h1' | 'h2' | 'h3' | 'hr' | 'table' | 'code' | 'ul' | 'p';
  text?: string;
  rows?: string[][];
  items?: string[];
}

function parseMarkdownBlocks(md: string): ParsedBlock[] {
  const lines = md.split(/\r?\n/);
  const blocks: ParsedBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const raw = lines[i];
    const trimmed = raw.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    if (trimmed.startsWith('```')) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++;
      blocks.push({ type: 'code', text: codeLines.join('\n') });
      continue;
    }

    if (/^---+$/.test(trimmed)) {
      blocks.push({ type: 'hr' });
      i++;
      continue;
    }

    if (trimmed.startsWith('# ')) {
      blocks.push({ type: 'h1', text: trimmed.slice(2).trim() });
      i++;
      continue;
    }
    if (trimmed.startsWith('## ')) {
      blocks.push({ type: 'h2', text: trimmed.slice(3).trim() });
      i++;
      continue;
    }
    if (trimmed.startsWith('### ')) {
      blocks.push({ type: 'h3', text: trimmed.slice(4).trim() });
      i++;
      continue;
    }

    if (trimmed.startsWith('|')) {
      const tableRows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        const rowLine = lines[i].trim();
        const cells = rowLine
          .replace(/^\|/, '')
          .replace(/\|$/, '')
          .split('|')
          .map((c) => c.trim());
        const isSeparator = cells.every((c) => /^:?-{2,}:?$/.test(c));
        if (!isSeparator) {
          tableRows.push(cells);
        }
        i++;
      }
      if (tableRows.length > 0) {
        blocks.push({ type: 'table', rows: tableRows });
      }
      continue;
    }

    if (trimmed.startsWith('* ') || trimmed.startsWith('- ') || /^\d+\.\s/.test(trimmed)) {
      const items: string[] = [];
      while (
        i < lines.length &&
        (lines[i].trim().startsWith('* ') ||
          lines[i].trim().startsWith('- ') ||
          /^\d+\.\s/.test(lines[i].trim()))
      ) {
        items.push(lines[i].trim().replace(/^(\*|-|\d+\.)\s+/, ''));
        i++;
      }
      blocks.push({ type: 'ul', items });
      continue;
    }

    blocks.push({ type: 'p', text: trimmed });
    i++;
  }

  return blocks;
}

function cleanInlineMarkdown(str: string): string {
  return str
    .replace(/<br\s*\/?>/gi, ' • ')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1');
}

export function CorporateDocsPanel() {
  const [docs, setDocs] = useState<CorporateDocItem[]>([]);
  const [selectedId, setSelectedId] = useState<string>('bast');
  const [viewMode, setViewMode] = useState<'formatted' | 'raw'>('formatted');
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

  // Fixes QC Finding #6: Substitute ALL placeholders including bottom signature cells
  const renderedContent = useMemo(() => {
    if (!currentDoc) return '';
    let idxNamaLengkap = 0;
    return currentDoc.content
      .replace(/\[Nama Perusahaan Korporasi\]|\[Nama Perusahaan\]/g, companyName)
      .replace(
        /\[Nama Pejabat Pihak Pertama\]|\[Nama Lengkap VP Bisnis\]|\[Nama Lengkap VP Sales\]/g,
        pihakPertama
      )
      .replace(
        /\[Nama Pejabat Pihak Kedua\]|\[Nama System Architect\]|\[Nama Lengkap PMO\]|\[Nama Lengkap BA\/PM\]/g,
        pihakKedua
      )
      .replace(/\[Nama Direktur Utama\]|\[Nama Direktur\]|\[Nama Direktur Operasi\]/g, direkturName)
      .replace(/\[Nama Lengkap\]/g, () => {
        idxNamaLengkap += 1;
        if (idxNamaLengkap === 1) return pihakKedua;
        if (idxNamaLengkap === 2) return pihakPertama;
        return direkturName;
      });
  }, [currentDoc, companyName, pihakPertama, pihakKedua, direkturName]);

  const parsedBlocks = useMemo(() => parseMarkdownBlocks(renderedContent), [renderedContent]);

  const handleCopy = async () => {
    if (!renderedContent) return;
    await navigator.clipboard.writeText(renderedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Control Studio Header */}
      <div className="no-print rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 shrink-0 text-blue-700" />
              <h2 className="text-base font-bold text-slate-900">
                Pusat Perdokumenan & Studio Cetak A4 Korporasi Indonesia (ISO 9001 / COBIT 2019 / SPI)
              </h2>
            </div>
            <p className="mt-1 text-xs text-slate-600">
              Standar penomoran baku:{' '}
              <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-blue-700">
                [KODE-ENTITAS]/[KODE-DIVISI]/[JENIS-DOK]/[KODE-PROYEK]/[TAHUN]/[NO-URUT]
              </code>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => setViewMode('formatted')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  viewMode === 'formatted'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Eye className="h-3.5 w-3.5" />
                Lembar A4 Resmi
              </button>
              <button
                type="button"
                onClick={() => setViewMode('raw')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  viewMode === 'raw'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Code2 className="h-3.5 w-3.5" />
                Markdown
              </button>
            </div>

            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Tersalin!' : 'Salin'}
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-800"
            >
              <Printer className="h-4 w-4" />
              Cetak / PDF A4
            </button>
          </div>
        </div>

        {/* Aligned Single-Row Variable Inputs (Fixes Frame 8 Vertical Offset QC Bug) */}
        <div className="mt-4 grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2 xl:grid-cols-4">
          <div>
            <label className="block truncate text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Nama Entitas PT
            </label>
            <div className="mt-1.5 flex h-10 items-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-3 focus-within:border-blue-600 focus-within:bg-white">
              <Building2 className="h-4 w-4 shrink-0 text-slate-400" />
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full bg-transparent text-xs font-medium text-slate-900 focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block truncate text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Pihak Pertama (Pemilik Proyek)
            </label>
            <input
              type="text"
              value={pihakPertama}
              onChange={(e) => setPihakPertama(e.target.value)}
              className="mt-1.5 h-10 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 text-xs font-medium text-slate-900 focus:border-blue-600 focus:bg-white"
            />
          </div>
          <div>
            <label className="block truncate text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Pihak Kedua (Pelaksana TI)
            </label>
            <input
              type="text"
              value={pihakKedua}
              onChange={(e) => setPihakKedua(e.target.value)}
              className="mt-1.5 h-10 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 text-xs font-medium text-slate-900 focus:border-blue-600 focus:bg-white"
            />
          </div>
          <div>
            <label className="block truncate text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Direktur Pengesah (Sponsor)
            </label>
            <input
              type="text"
              value={direkturName}
              onChange={(e) => setDirekturName(e.target.value)}
              className="mt-1.5 h-10 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 text-xs font-medium text-slate-900 focus:border-blue-600 focus:bg-white"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Document Selector Column */}
        <div className="no-print space-y-2.5 lg:col-span-4">
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
                  <span className="truncate font-mono text-[11px] font-bold text-blue-700">
                    {doc.docCode}
                  </span>
                  <span className="shrink-0 whitespace-nowrap rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-700">
                    {doc.phase}
                  </span>
                </div>
                <div className="mt-1.5 flex items-start gap-2">
                  <FileText className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold leading-snug text-slate-900">{doc.title}</p>
                    <p className="mt-0.5 truncate font-mono text-[11px] text-slate-500">
                      /docs/{doc.filename}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Official Corporate A4 Sheet Renderer */}
        <div className="print-sheet rounded-2xl border border-slate-300 bg-white p-8 shadow-sm lg:col-span-8">
          {currentDoc ? (
            viewMode === 'raw' ? (
              <pre className="max-h-[720px] overflow-y-auto whitespace-pre-wrap rounded-xl bg-slate-50 p-5 font-mono text-xs leading-relaxed text-slate-800">
                {renderedContent}
              </pre>
            ) : (
              <div className="space-y-5">
                {/* Authentic Indonesian Corporate Letterhead */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-slate-900 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-950 font-black text-white">
                      MPC
                    </div>
                    <div>
                      <p className="text-sm font-black uppercase tracking-wide text-slate-900">
                        PT {companyName}
                      </p>
                      <p className="text-[11px] text-slate-600">
                        Divisi Tata Kelola TI, PMO & Kepatuhan Korporasi • Standar ISO 9001:2015 & ISO/IEC 27001:2022
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-block rounded border border-slate-900 bg-slate-900 px-2.5 py-0.5 font-mono text-[11px] font-bold text-white">
                      {currentDoc.docCode}
                    </span>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-amber-800">
                      RAHASIA / DOKUMEN RESMI KORPORASI
                    </p>
                  </div>
                </div>

                {/* Rendered Structured Content */}
                <div className="max-h-[680px] space-y-4 overflow-y-auto pr-2 print:max-h-none">
                  {parsedBlocks.map((b, idx) => {
                    if (b.type === 'h1') {
                      return (
                        <h1
                          key={idx}
                          className="pt-2 text-center text-base font-extrabold uppercase tracking-tight text-slate-900"
                        >
                          {cleanInlineMarkdown(b.text || '')}
                        </h1>
                      );
                    }
                    if (b.type === 'h2') {
                      return (
                        <h2
                          key={idx}
                          className="border-b border-slate-200 pb-1.5 pt-3 text-xs font-extrabold uppercase tracking-wider text-blue-900"
                        >
                          {cleanInlineMarkdown(b.text || '')}
                        </h2>
                      );
                    }
                    if (b.type === 'h3') {
                      return (
                        <h3 key={idx} className="pt-2 text-xs font-bold text-slate-900">
                          {cleanInlineMarkdown(b.text || '')}
                        </h3>
                      );
                    }
                    if (b.type === 'hr') {
                      return <hr key={idx} className="border-slate-200" />;
                    }
                    if (b.type === 'code') {
                      return (
                        <pre
                          key={idx}
                          className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-3.5 font-mono text-[11px] text-slate-800"
                        >
                          {b.text}
                        </pre>
                      );
                    }
                    if (b.type === 'ul') {
                      return (
                        <ul key={idx} className="list-disc space-y-1.5 pl-5 text-xs leading-relaxed text-slate-800">
                          {(b.items || []).map((it, li) => (
                            <li key={li}>{cleanInlineMarkdown(it)}</li>
                          ))}
                        </ul>
                      );
                    }
                    if (b.type === 'table' && b.rows && b.rows.length > 0) {
                      const [headerRow, ...bodyRows] = b.rows;
                      const isSignatureTable = headerRow.some((h) =>
                        h.toUpperCase().includes('PIHAK KEDUA')
                      );

                      if (isSignatureTable) {
                        return (
                          <div
                            key={idx}
                            className="mt-6 grid grid-cols-1 gap-4 pt-2 sm:grid-cols-3"
                          >
                            {[
                              {
                                role: 'PIHAK KEDUA (Yang Menyerahkan)',
                                name: pihakKedua,
                                title: 'Project Manager Pengembang',
                                meterai: true,
                              },
                              {
                                role: 'PIHAK PERTAMA (Yang Menerima)',
                                name: pihakPertama,
                                title: 'VP Pemilik Proyek',
                                meterai: true,
                              },
                              {
                                role: 'MENGETAHUI / MENYETUJUI',
                                name: direkturName,
                                title: 'Direktur Utama / Sponsor',
                                meterai: false,
                              },
                            ].map((sig, sIdx) => (
                              <div
                                key={sIdx}
                                className="flex flex-col justify-between rounded-xl border border-slate-300 bg-slate-50/60 p-4 text-center"
                              >
                                <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700">
                                  {sig.role}
                                </p>
                                <div className="my-4 flex flex-col items-center justify-center gap-1.5">
                                  {sig.meterai && (
                                    <div className="inline-flex items-center gap-1 rounded border border-rose-400 bg-rose-50 px-2.5 py-1 font-mono text-[10px] font-bold text-rose-800">
                                      <Stamp className="h-3 w-3" />
                                      e-Meterai Rp10.000
                                    </div>
                                  )}
                                  <span className="rounded bg-emerald-100 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-800">
                                    TTE PSrE Terverifikasi
                                  </span>
                                </div>
                                <div>
                                  <p className="text-xs font-extrabold underline text-slate-900">
                                    {sig.name}
                                  </p>
                                  <p className="text-[11px] text-slate-600">{sig.title}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      }

                      return (
                        <div key={idx} className="overflow-x-auto rounded-xl border border-slate-300">
                          <table className="w-full border-collapse text-left text-xs">
                            <thead>
                              <tr className="bg-slate-100 text-[11px] font-bold uppercase text-slate-700">
                                {headerRow.map((cell, cIdx) => (
                                  <th
                                    key={cIdx}
                                    className="border-b border-r border-slate-300 px-3 py-2 last:border-r-0"
                                  >
                                    {cleanInlineMarkdown(cell)}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                              {bodyRows.map((row, rIdx) => (
                                <tr key={rIdx} className="odd:bg-white even:bg-slate-50/50">
                                  {row.map((cell, cIdx) => (
                                    <td
                                      key={cIdx}
                                      className="border-r border-slate-200 px-3 py-2 align-top text-slate-800 last:border-r-0"
                                    >
                                      {cleanInlineMarkdown(cell)}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );
                    }
                    return (
                      <p key={idx} className="text-xs leading-relaxed text-slate-800">
                        {cleanInlineMarkdown(b.text || '')}
                      </p>
                    );
                  })}
                </div>
              </div>
            )
          ) : (
            <div className="py-16 text-center text-sm text-slate-500">
              Memuat paket dokumen korporasi...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
