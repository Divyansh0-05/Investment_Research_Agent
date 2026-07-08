"use client";

import { useState, useRef } from "react";
import ProgressTimeline from "@/components/ProgressTimeline";
import VerdictCard from "@/components/VerdictCard";
import ScoreBars from "@/components/ScoreBars";
import ResearchDetails from "@/components/ResearchDetails";
import type { AgentResult, ProgressEvent } from "@/src/agent/types";

const EXAMPLE_COMPANIES = ["Zerodha", "Zomato", "Perplexity AI", "Nvidia"];

export default function Home() {
  const [companyName, setCompanyName] = useState("");
  const [running, setRunning] = useState(false);
  const [events, setEvents] = useState<ProgressEvent[]>([]);
  const [result, setResult] = useState<AgentResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  async function runAgent(name: string) {
    if (!name.trim() || running) return;
    setRunning(true);
    setEvents([]);
    setResult(null);
    setError(null);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName: name.trim() }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Request failed (${res.status})`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const parts = buffer.split("\n\n");
        buffer = parts.pop() || "";

        for (const part of parts) {
          if (!part.startsWith("data: ")) continue;
          const json = part.slice(6);
          try {
            const event: ProgressEvent = JSON.parse(json);
            setEvents((prev) => [...prev, event]);
            if (event.stage === "done" && event.result) {
              setResult(event.result);
            }
            if (event.stage === "error") {
              setError(event.error || "Something went wrong.");
            }
          } catch {
            // ignore malformed chunk
          }
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setError(err.message || "Something went wrong.");
      }
    } finally {
      setRunning(false);
    }
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-4xl px-6 py-14">
        <header className="mb-10">
          <p className="text-xs font-mono uppercase tracking-widest text-accent mb-3">
            AI Investment Research Agent
          </p>
          <h1 className="text-3xl md:text-4xl font-semibold text-slate-100 mb-3">
            Give it a company. It researches, scores, and decides.
          </h1>
          <p className="text-slate-400 max-w-2xl leading-relaxed">
            A LangGraph.js agent that identifies the company, researches news, financials, and
            competitors in parallel, extracts structured findings, scores six investment
            dimensions, and renders a final <span className="text-invest">INVEST</span> /{" "}
            <span className="text-watch">WATCH</span> / <span className="text-pass">PASS</span>{" "}
            verdict with full reasoning and sources.
          </p>
        </header>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            runAgent(companyName);
          }}
          className="flex flex-col sm:flex-row gap-3 mb-4"
        >
          <input
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Enter a company name, e.g. Zerodha"
            disabled={running}
            className="flex-1 rounded-xl bg-panel border border-line px-4 py-3 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-accent2/50 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={running || !companyName.trim()}
            className="rounded-xl bg-accent2 hover:bg-accent2/90 disabled:opacity-40 disabled:cursor-not-allowed text-ink font-semibold px-6 py-3 transition"
          >
            {running ? "Researching…" : "Analyze"}
          </button>
        </form>

        <div className="flex flex-wrap gap-2 mb-10">
          <span className="text-xs text-slate-600 mr-1 self-center">Try:</span>
          {EXAMPLE_COMPANIES.map((c) => (
            <button
              key={c}
              onClick={() => {
                setCompanyName(c);
                runAgent(c);
              }}
              disabled={running}
              className="text-xs rounded-full border border-line px-3 py-1.5 text-slate-400 hover:text-slate-200 hover:border-accent2/50 transition disabled:opacity-40"
            >
              {c}
            </button>
          ))}
        </div>

        {error && (
          <div className="card border-pass/40 bg-pass/5 p-4 mb-6 text-sm text-red-300">{error}</div>
        )}

        {events.length > 0 && (
          <div className="space-y-6">
            <ProgressTimeline events={events} />
            {result && (
              <>
                <VerdictCard verdict={result.verdict} />
                <ScoreBars scores={result.scores} />
                <ResearchDetails result={result} />
                <p className="text-xs text-slate-600 text-center pt-2">
                  Generated {new Date(result.generatedAt).toLocaleString()} · Not financial advice.
                  AI-generated research for demonstration purposes.
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
