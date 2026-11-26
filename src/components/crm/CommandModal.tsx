'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Search, X, Briefcase, Building2, FileCheck2, Receipt, FileText, Workflow } from 'lucide-react';

export interface SearchableItem {
  id: string;
  category: 'DEAL' | 'ACCOUNT' | 'CONTRACT' | 'INVOICE' | 'DOC' | 'WORKFLOW';
  code: string;
  title: string;
  subtitle: string;
  targetTab: string;
}

interface CommandModalProps {
  open: boolean;
  onClose: () => void;
  items: SearchableItem[];
  onSelect: (tab: string) => void;
}

export function CommandModal({ open, onClose, items, onSelect }: CommandModalProps) {
  const [query, setQuery] = useState('');

  // Close cleanly on Escape key (Fixes QC Finding #7)
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items.slice(0, 10);
    return items
      .filter(
        (it) =>
          it.code.toLowerCase().includes(q) ||
          it.title.toLowerCase().includes(q) ||
          it.subtitle.toLowerCase().includes(q)
      )
      .slice(0, 12);
  }, [items, query]);

  if (!open) return null;

  const iconFor = (cat: SearchableItem['category']) => {
    switch (cat) {
      case 'DEAL':
        return <Briefcase className="h-4 w-4 text-blue-600" />;
      case 'ACCOUNT':
        return <Building2 className="h-4 w-4 text-indigo-600" />;
      case 'CONTRACT':
        return <FileCheck2 className="h-4 w-4 text-emerald-600" />;
      case 'INVOICE':
        return <Receipt className="h-4 w-4 text-amber-600" />;
      case 'WORKFLOW':
        return <Workflow className="h-4 w-4 text-violet-600" />;
      default:
        return <FileText className="h-4 w-4 text-slate-600" />;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/60 p-4 pt-20 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Global Command Search"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3.5">
          <Search className="h-5 w-5 shrink-0 text-slate-400" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari proyek EPC/MPC, akun BUMN/Tbk, nomor SPK/PPJB, VA, workflow, atau dokumen..."
            className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          <kbd className="hidden rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-500 sm:inline-block">
            ESC
          </kbd>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Tutup pencarian"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-96 divide-y divide-slate-100 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-slate-500">
              Tidak ditemukan entitas yang cocok dengan kata kunci &ldquo;{query}&rdquo;.
            </div>
          ) : (
            filtered.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelect(item.targetTab);
                  onClose();
                }}
                className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition hover:bg-blue-50/60"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
                    {iconFor(item.category)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="shrink-0 whitespace-nowrap font-mono text-xs font-semibold text-blue-700">
                        {item.code}
                      </span>
                      <span className="truncate text-sm font-semibold text-slate-900">{item.title}</span>
                    </div>
                    <p className="truncate text-xs text-slate-500">{item.subtitle}</p>
                  </div>
                </div>
                <span className="shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                  {item.category}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
