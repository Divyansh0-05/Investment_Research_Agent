"use client";

import type { AgentResult } from "@/src/agent/types";

export default function ResearchDetails({ result }: { result: AgentResult }) {
  const { research, sources, resolvedIdentity } = result;

  return (
    <div className="card p-6 animate-fadeUp">
      <h3 className="text-sm font-medium tracking-wide text-slate-300 uppercase mb-4">Research Findings</h3>

      <div className="mb-5">
        <p className="text-xs text-slate-500 mb-1">{resolvedIdentity.sector} · {resolvedIdentity.listingStatus}</p>
        <p className="text-sm text-slate-300 leading-relaxed">{research.businessSummary}</p>
      </div>

      {research.keyMetrics.length > 0 && (
        <div className="mb-5">
          <h4 className="text-xs uppercase tracking-wide text-slate-500 mb-2">Key Metrics</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {research.keyMetrics.map((m, i) => (
              <div key={i} className="rounded-lg bg-panel2 border border-line px-3 py-2">
                <p className="text-[11px] text-slate-500">{m.label}</p>
                <p className="text-sm font-mono text-slate-200">{m.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-5 mb-5">
        <div>
          <h4 className="text-xs uppercase tracking-wide text-slate-500 mb-2">Recent Developments</h4>
          <ul className="space-y-1.5 text-sm text-slate-300 list-disc list-inside">
            {research.recentDevelopments.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-xs uppercase tracking-wide text-slate-500 mb-2">Risks Identified</h4>
          <ul className="space-y-1.5 text-sm text-slate-300 list-disc list-inside">
            {research.risks.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      </div>

      {research.competitors.length > 0 && (
        <div className="mb-5">
          <h4 className="text-xs uppercase tracking-wide text-slate-500 mb-2">Competitors</h4>
          <div className="flex flex-wrap gap-2">
            {research.competitors.map((c, i) => (
              <span key={i} className="text-xs rounded-full border border-line px-3 py-1 text-slate-300">
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {sources.length > 0 && (
        <div>
          <h4 className="text-xs uppercase tracking-wide text-slate-500 mb-2">Sources ({sources.length})</h4>
          <ul className="space-y-1">
            {sources.map((s, i) => (
              <li key={i} className="text-xs">
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent2 hover:underline break-all"
                >
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
