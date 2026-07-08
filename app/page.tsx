"use client";

import { useState } from "react";
import ProgressTimeline from "@/components/ProgressTimeline";
import VerdictCard from "@/components/VerdictCard";
import ScoreBars from "@/components/ScoreBars";
import ResearchDetails from "@/components/ResearchDetails";
import Landing from "@/components/Landing";
import { useAgentStream } from "@/lib/useAgentStream";

const EXAMPLE_COMPANIES = ["Zerodha", "Zomato", "Perplexity AI", "Nvidia"];

export default function Home() {
  const [companyName, setCompanyName] = useState("");
  const { events, result, error, running, runAgent } = useAgentStream();

  const showLanding = !running && !result && events.length === 0;

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-4xl px-6 py-14">
        {showLanding ? (
          <Landing
            companyName={companyName}
            running={running}
            exampleCompanies={EXAMPLE_COMPANIES}
            error={error}
            onCompanyNameChange={setCompanyName}
            onRunAgent={runAgent}
          />
        ) : (
          <>
            {error && (
              <div className="card border-pass/40 bg-pass/5 p-4 mb-6 text-sm text-red-300">{error}</div>
            )}

            <div className="space-y-6">
              <ProgressTimeline events={events} />
              {result && (
                <>
                  <VerdictCard verdict={result.verdict} />
                  <ScoreBars scores={result.scores} />
                  <ResearchDetails result={result} />
                  <p className="text-xs text-slate-600 text-center pt-2">
                    Generated {new Date(result.generatedAt).toLocaleString()}{" "}
                    &middot; Not financial advice. AI-generated research for demonstration
                    purposes.
                  </p>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}

