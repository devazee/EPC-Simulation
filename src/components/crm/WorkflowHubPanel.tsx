'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Workflow,
  Play,
  Download,
  Copy,
  Check,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Clock,
  Layers,
} from 'lucide-react';
import { RoleProfile } from '@/lib/governance';
import { formatDateTimeId, Lang } from '@/lib/formatters';

/* eslint-disable @typescript-eslint/no-explicit-any */

interface WorkflowHubProps {
  activeRole: RoleProfile;
  lang: Lang;
  canvaUrl?: string;
  notify: (type: 'ok' | 'err', msg: string) => void;
  onRefreshParent: () => Promise<void>;
}

export function WorkflowHubPanel({
  activeRole,
  lang,
  canvaUrl,
  notify,
  onRefreshParent,
}: WorkflowHubProps) {
  const [wfData, setWfData] = useState<any>(null);
  const [runningKey, setRunningKey] = useState<string | null>(null);
  const [copiedJson, setCopiedJson] = useState(false);

  const loadWorkflows = useCallback(async () => {
    try {
      const res = await fetch('/api/crm/workflows', { cache: 'no-store' });
      const json = await res.json();
      setWfData(json);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadWorkflows();
  }, [loadWorkflows]);

  async function handleRunWorkflow(workflowKey: string) {
    setRunningKey(workflowKey);
    try {
      const res = await fetch('/api/crm/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflowKey, actorRole: activeRole.role }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal menjalankan workflow');
      notify(
        'ok',
        `Workflow ${json.run.run_code} selesai dieksekusi (${json.run.duration_ms}ms) & tercatat di Audit Log.`
      );
      await Promise.all([loadWorkflows(), onRefreshParent()]);
    } catch (err: any) {
      notify('err', err.message);
    } finally {
      setRunningKey(null);
    }
  }

  async function handleCopyBlueprint() {
    if (!wfData?.n8nBlueprint) return;
    await navigator.clipboard.writeText(wfData.n8nBlueprint);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  }

  function handleDownloadBlueprint() {
    if (!wfData?.n8nBlueprint) return;
    const blob = new Blob([wfData.n8nBlueprint], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'enterprise-crm-n8n-pack.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  const figjamUrl =
    wfData?.figjamUrl ||
    'https://www.figma.com/board/iekAkQkSTIHZ6AVB6uZIAj?utm_source=other&utm_content=edit_in_figjam';

  return (
    <div className="space-y-6">
      {/* Connected Customization Ecosystem Banner */}
      <div className="rounded-2xl border border-indigo-200 bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 p-6 text-white shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/20 px-3 py-1 text-[11px] font-bold text-indigo-200 ring-1 ring-indigo-400/30">
              <Sparkles className="h-3.5 w-3.5" />
              {lang === 'ID'
                ? 'Integrasi Tools Customization Aktif (n8n • Figma FigJam • Canva • Vercel)'
                : 'Connected Customization Suite (n8n • Figma FigJam • Canva • Vercel)'}
            </span>
            <h2 className="mt-2 text-lg font-extrabold tracking-tight">
              {lang === 'ID'
                ? 'Pusat Orkestrasi Workflow Otomatis & Desain Arsitektur Sistem'
                : 'Automated Workflow Orchestration & System Design Hub'}
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-300">
              {lang === 'ID'
                ? 'Jalankan simulasi workflow otomasi langsung ke Neon PostgreSQL, unduh paket JSON resmi n8n untuk diimpor ke instance n8n Anda, atau buka papan diagram arsitektur di FigJam & dek eksekutif di Canva.'
                : 'Execute real-time database workflows against Neon PostgreSQL, export ready-to-import n8n JSON blueprints, or open your live FigJam architecture board & Canva executive deck.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <a
              href={figjamUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-xs font-bold text-slate-950 shadow-sm transition hover:bg-blue-50"
            >
              <Layers className="h-4 w-4 text-violet-600" />
              Buka Diagram FigJam
              <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
            </a>

            {canvaUrl && (
              <a
                href={canvaUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-400/40 bg-cyan-500/15 px-3.5 py-2 text-xs font-bold text-cyan-100 transition hover:bg-cyan-500/25"
              >
                Buka Dek Eksekutif Canva
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}

            <button
              type="button"
              onClick={handleCopyBlueprint}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-bold text-slate-100 hover:bg-slate-800"
            >
              {copiedJson ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              {copiedJson ? 'JSON Tersalin' : 'Salin n8n JSON'}
            </button>

            <button
              type="button"
              onClick={handleDownloadBlueprint}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-blue-500"
            >
              <Download className="h-4 w-4" />
              Unduh Paket n8n
            </button>
          </div>
        </div>
      </div>

      {/* 4 Interactive Automation Pipelines */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {(wfData?.workflows || []).map((wf: any) => {
          const isRunning = runningKey === wf.key;
          return (
            <div
              key={wf.key}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                      <Workflow className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        {lang === 'ID' ? wf.titleId : wf.titleEn}
                      </h3>
                      <p className="font-mono text-[11px] text-blue-700">{wf.engine}</p>
                    </div>
                  </div>
                  <span className="shrink-0 whitespace-nowrap rounded-full bg-emerald-50 px-2.5 py-0.5 font-mono text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200">
                    READY
                  </span>
                </div>

                <p className="mt-3 text-xs leading-relaxed text-slate-600">
                  {lang === 'ID' ? wf.descriptionId : wf.descriptionEn}
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                <span className="truncate font-mono text-[11px] text-slate-500">
                  Trigger: {wf.trigger}
                </span>
                <button
                  type="button"
                  disabled={Boolean(runningKey)}
                  onClick={() => handleRunWorkflow(wf.key)}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-blue-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-800 disabled:opacity-50"
                >
                  <Play className="h-3.5 w-3.5" />
                  {isRunning
                    ? lang === 'ID'
                      ? 'Mengeksekusi...'
                      : 'Running...'
                    : lang === 'ID'
                    ? 'Jalankan Workflow'
                    : 'Run Workflow'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Execution Log from Neon PostgreSQL */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {lang === 'ID'
                ? 'Riwayat Eksekusi Workflow & Webhook n8n (Tersimpan di Neon PostgreSQL)'
                : 'Live Workflow & n8n Webhook Execution History (Neon PostgreSQL)'}
            </h3>
            <p className="text-xs text-slate-500">
              Endpoint inbound siap dihubungkan dari node HTTP Request n8n:{' '}
              <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-blue-700">
                POST /api/crm/webhooks/n8n
              </code>
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {(wfData?.runs || []).map((run: any) => (
            <div key={run.id} className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-700">{run.run_code}</span>
                    <span className="rounded bg-slate-200/80 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-700">
                      {run.trigger_source}
                    </span>
                    <span className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-500">
                      <Clock className="h-3 w-3" /> {run.duration_ms}ms
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-bold text-slate-900">{run.workflow_title}</p>
                  <p className="mt-0.5 text-xs text-slate-600">{run.output_summary}</p>
                </div>

                <div className="shrink-0 text-right">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {run.status}
                  </span>
                  <p className="mt-1 font-mono text-[11px] text-slate-500">
                    {formatDateTimeId(run.created_at)}
                  </p>
                </div>
              </div>

              {Array.isArray(run.steps) && run.steps.length > 0 && (
                <div className="mt-3 grid grid-cols-1 gap-2 border-t border-slate-200/80 pt-3 sm:grid-cols-3">
                  {run.steps.map((st: any, idx: number) => (
                    <div
                      key={idx}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px]"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-slate-800">{st.step}</span>
                        {st.status === 'WARN' ? (
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                        )}
                      </div>
                      <p className="mt-0.5 text-slate-500">{st.detail}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
