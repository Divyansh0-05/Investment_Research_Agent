"use client";

import type { Verdict } from "@/src/agent/types";

const DECISION_STYLES: Record<Verdict["decision"], { bg: string; text: string; ring: string; label: string }> = {
  INVEST: { bg: "bg-invest/15", text: "text-invest", ring: "ring-invest/40", label: "INVEST" },
  WATCH: { bg: "bg-watch/15", text: "text-watch", ring: "ring-watch/40", label: "WATCH" },
  PASS: { bg: "bg-pass/15", text: "text-pass", ring: "ring-pass/40", label: "PASS" },
};

export default function VerdictCard({ verdict }: { verdict: Verdict }) {
  const style = DECISION_STYLES[verdict.decision];

  return (
    <div className="card p-6 md:p-8 animate-fadeUp">
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <span
          className={`inline-flex items-center rounded-full px-4 py-1.5 text-lg font-bold tracking-wide ring-1 ${style.bg} ${style.text} ${style.ring}`}
        >
          {style.label}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 uppercase tracking-wide">Confidence</span>
          <span className="text-sm font-mono text-slate-200">{verdict.confidence}%</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 uppercase tracking-wide">Weighted score</span>
          <span className="text-sm font-mono text-slate-200">{verdict.weightedScore.toFixed(1)}/10</span>
        </div>
      </div>

      <p className="text-lg text-slate-100 font-medium mb-3">{verdict.headline}</p>
      <p className="text-sm text-slate-400 leading-relaxed mb-6">{verdict.thesis}</p>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <h4 className="text-xs uppercase tracking-wide text-invest mb-2 font-semibold">Bull case</h4>
          <ul className="space-y-1.5">
            {verdict.bullCase.map((point, i) => (
              <li key={i} className="text-sm text-slate-300 flex gap-2">
                <span className="text-invest">+</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-xs uppercase tracking-wide text-pass mb-2 font-semibold">Bear case</h4>
          <ul className="space-y-1.5">
            {verdict.bearCase.map((point, i) => (
              <li key={i} className="text-sm text-slate-300 flex gap-2">
                <span className="text-pass">-</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
