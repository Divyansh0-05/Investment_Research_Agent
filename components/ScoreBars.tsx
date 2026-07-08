"use client";

import type { DimensionScores } from "@/src/agent/types";

const DIMENSION_META: { key: keyof DimensionScores; label: string; weight: string }[] = [
  { key: "financialHealth", label: "Financial Health", weight: "25%" },
  { key: "growth", label: "Growth", weight: "20%" },
  { key: "moat", label: "Competitive Moat", weight: "20%" },
  { key: "management", label: "Management & Execution", weight: "10%" },
  { key: "risk", label: "Risk (higher = safer)", weight: "15%" },
  { key: "valuation", label: "Valuation Attractiveness", weight: "10%" },
];

function colorFor(score: number) {
  if (score >= 7) return "#34D399";
  if (score >= 4.5) return "#FBBF24";
  return "#F87171";
}

export default function ScoreBars({ scores }: { scores: DimensionScores }) {
  return (
    <div className="card p-6 animate-fadeUp">
      <h3 className="text-sm font-medium tracking-wide text-slate-300 uppercase mb-5">Dimension Scores</h3>
      <div className="space-y-4">
        {DIMENSION_META.map(({ key, label, weight }) => {
          const value = scores[key] ?? 0;
          return (
            <div key={key}>
              <div className="flex justify-between items-baseline mb-1.5">
                <span className="text-sm text-slate-300">{label}</span>
                <span className="text-xs font-mono text-slate-500">
                  {value.toFixed(1)}/10 <span className="text-slate-600">· weight {weight}</span>
                </span>
              </div>
              <div className="scoreBar">
                <div
                  className="scoreBarFill"
                  style={{ width: `${(value / 10) * 100}%`, background: colorFor(value) }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
