"use client";

import type { ProgressEvent } from "@/src/agent/types";
import { STAGES } from "@/src/agent/stages";

const ORDERED_STAGES = [...STAGES].sort((a, b) => a.order - b.order);

export default function ProgressTimeline({ events }: { events: ProgressEvent[] }) {
  const completedStages = new Set(events.filter((e) => e.status === "completed").map((e) => e.stage));
  const hasError = events.some((e) => e.status === "error");
  const lastEvent = events[events.length - 1];

  return (
    <div className="card p-6 animate-fadeUp">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-medium tracking-wide text-slate-300 uppercase">Agent Progress</h3>
        <span className="text-xs font-mono text-slate-500">LangGraph.js state machine</span>
      </div>
      <ol className="space-y-0">
        {ORDERED_STAGES.map((stage, i) => {
          const done = completedStages.has(stage.id);
          const previousStage = ORDERED_STAGES[i - 1]?.id;
          const isCurrent =
            !done && !hasError && (i === 0 || (previousStage !== undefined && completedStages.has(previousStage)));
          const isParallelGroup = ["research_news", "research_financials", "research_competitors"].includes(stage.id);

          return (
            <li key={stage.id} className="relative pl-9 pb-5 last:pb-0">
              {i < ORDERED_STAGES.length - 1 && (
                <span
                  className={`absolute left-[11px] top-6 bottom-0 w-px ${
                    done ? "bg-accent/50" : "bg-line"
                  }`}
                />
              )}
              <span
                className={`absolute left-0 top-0.5 flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-mono ${
                  done
                    ? "bg-accent/20 border-accent text-accent"
                    : isCurrent
                    ? "border-accent2 text-accent2 animate-pulseSoft"
                    : "border-line text-slate-600"
                }`}
              >
                {done ? "✓" : i + 1}
              </span>
              <div className="flex items-baseline gap-2">
                <span className={`text-sm ${done ? "text-slate-200" : isCurrent ? "text-slate-200" : "text-slate-500"}`}>
                  {stage.timelineLabel}
                </span>
                {isParallelGroup && (
                  <span className="text-[10px] uppercase tracking-wide text-slate-600 font-mono">parallel</span>
                )}
              </div>
            </li>
          );
        })}
      </ol>
      {hasError && (
        <div className="mt-4 rounded-lg border border-pass/40 bg-pass/10 p-3 text-sm text-red-300">
          {lastEvent?.error || "Something went wrong."}
        </div>
      )}
    </div>
  );
}
