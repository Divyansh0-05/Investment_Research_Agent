# Analyst — AI Investment Research Agent

An agent that takes a company name, researches it (news, financials, competitive
landscape), scores it across six investment dimensions, and renders a final
**INVEST / WATCH / PASS** verdict with a full, sourced reasoning trail.

Built for the InsideIIM × Altuni AI Labs take-home assignment, on the required
stack: **Next.js (frontend + backend) + LangGraph.js (agent orchestration)**.

---

## 1. Overview

You type a company name (e.g. "Zerodha"). The agent:

1. **Identifies** the company precisely (full name, sector, listing status).
2. **Researches in parallel** — recent news, financials, and competitive
   landscape — via live web search.
3. **Extracts** structured findings from the raw research (metrics, recent
   developments, competitors, risks) — grounded only in what was actually
   found, not invented.
4. **Scores** six dimensions (0–10 each): Financial Health, Growth,
   Competitive Moat, Management & Execution, Risk, Valuation.
5. **Decides**: combines the weighted score with the qualitative research to
   produce a final decision, a confidence level, a written thesis, and an
   explicit bull case / bear case.

The UI shows the agent's progress live, node by node, as the LangGraph state
machine executes — so the reasoning process is visible, not just the final
answer.

---

## 2. How to run it

### Prerequisites
- Node.js 18.18+ (Node 20+ recommended)
- A [Google Gemini API key](https://aistudio.google.com/app/apikey)
- A [Tavily API key](https://tavily.com/) (free tier is enough — this powers
  the web research)

### Setup

```bash
git clone <this-repo>
cd investment-agent
npm install
cp .env.example .env.local
```

Edit `.env.local`:

```
GOOGLE_API_KEY=...
TAVILY_API_KEY=tvly-...
```

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), type a company name, hit
Analyze.

### Deploy (Vercel)

```bash
npm i -g vercel
vercel
```

Add `GOOGLE_API_KEY` and `TAVILY_API_KEY` as environment variables in the
Vercel project settings, then `vercel --prod`. No other config needed — the
API route runs on Node.js runtime with a 120s max duration to comfortably fit
the multi-step agent run.

---

## 3. How it works — architecture

### High level

```
Browser (React, SSE client)
   │  POST /api/research { companyName }
   ▼
Next.js API Route (Node runtime, streams Server-Sent Events)
   │  runs the LangGraph.js agent, streams each node's completion
   ▼
LangGraph.js StateGraph  ──►  Google Gemini 2.5 Flash (via @langchain/google-genai)
   │                     ──►  Tavily Search (via @langchain/tavily)
   ▼
Structured AgentResult → streamed back to browser as the final event
```

### The graph (`src/agent/graph.ts`)

```
        ┌────────────┐
        │  identify  │  resolve company name → full name, sector, listing status
        └─────┬──────┘
   ┌───────────┼────────────────┐
   ▼           ▼                ▼
 news      financials      competitors     ← run in parallel (fan-out)
   │           │                │
   └───────────┴────────────────┘
               ▼
           extract          ← fan-in: synthesize all 3 research streams
               ▼
             score          ← 6 dimension scores, 0–10
               ▼
            decide          ← final INVEST / WATCH / PASS + thesis
```

This is a real `StateGraph` from `@langchain/langgraph`, not a chain of
sequential prompts — the three research nodes genuinely run concurrently
(LangGraph's superstep model waits for all three before triggering
`extract`), which is both faster and a more honest representation of how a
research agent should be structured.

Each node that needs structured output (`identify`, `extract`, `score`,
`decide`) uses `.withStructuredOutput()` with a Zod schema, so the LLM's
output is validated and typed rather than parsed out of free text.

### Streaming progress to the UI

The API route uses `agent.stream(input, { streamMode: "updates" })`, which
yields each node's partial state update the moment that node finishes. The
route re-emits these as Server-Sent Events, and the frontend renders them
live against a fixed 7-step timeline — so the person watching sees "Scanning
financials → Scanning competitors → Synthesizing findings → Scoring →
Deciding" happen in real time, not a spinner.

### Files

```
app/page.tsx                     Main UI (input, live progress, results)
app/api/research/route.ts        SSE API route that runs the agent
src/agent/graph.ts                LangGraph state graph + all node logic
src/agent/types.ts                Shared TypeScript types
components/ProgressTimeline.tsx   Live step-by-step agent progress
components/VerdictCard.tsx        Decision, confidence, thesis, bull/bear case
components/ScoreBars.tsx          6-dimension score visualization
components/ResearchDetails.tsx    Extracted metrics, developments, sources
```

---

## 4. Key decisions & trade-offs

- **No paid market-data API (Bloomberg/Refinitiv/screener APIs).** These are
  either paywalled or require business verification that isn't practical for
  a 7-day take-home. Instead, the agent uses live web search (Tavily) as its
  research substrate. This is clearly disclosed in the UI footer — the tool
  is directional research, not a trading terminal.

- **Tri-state decision (INVEST / WATCH / PASS), not binary.** A binary
  invest/pass forces false confidence when evidence is genuinely mixed.
  WATCH is a first-class outcome and the system prompt explicitly tells the
  model not to default to INVEST.

- **Conservative scoring prompt.** The scoring node is explicitly instructed
  to score toward the middle (4–6) when evidence is thin, rather than let a
  single glowing news article push a score to 9. This is meant to counter
  the common LLM failure mode of being overly bullish when fed PR-heavy
  search results.

- **Structured outputs (Zod schemas) at every LLM step**, not one long
  prompt that returns free text. This makes every stage independently
  testable, keeps the UI rendering trivial (typed data in, typed data
  rendered out), and avoids brittle text-parsing.

- **Parallel research fan-out.** News, financials, and competitive research
  are independent concerns and don't need to run sequentially — modeling
  them as parallel branches in the graph is both faster and architecturally
  more honest than three sequential calls dressed up as "steps."

- **SSE over WebSockets.** The interaction is one request → one stream of
  progress → one final result; there's no need for bidirectional
  communication, so SSE (a single `ReadableStream` from a Next.js Route
  Handler) is simpler and needs no extra infrastructure.

- **Gemini 2.5 Flash as the LLM provider**, chosen as the default model — the model
  client is isolated in one function (`getModel()` in `graph.ts`), so
  swapping to OpenAI/Gemini is a localized change, not a rewrite.

### What I left out (and would add with more time — see §6)
- No persistence/history of past runs (each run is stateless).
- No numeric-price/valuation multiples validated against a real financial
  database — multiples mentioned in the report come from what's in the
  research text, not a computed model.
- No authentication / rate limiting (fine for a demo; not fine for
  production).

---

## 5. Example runs

> Run the app locally (`npm run dev`) and paste 2–3 real outputs here before
> submitting — screenshots or copy-pasted verdict + thesis text both work.
> Good picks: one company you expect a clear INVEST/PASS on, and one
> genuinely ambiguous one, to show the WATCH path isn't dead code.
>
> Suggested companies to try: **Zerodha**, **Zomato**, **Perplexity AI**,
> **Nvidia**, or any company relevant to your own interests.

**Example 1 — `<company name>`**
- Decision: `<INVEST/WATCH/PASS>`, confidence `<n>`%
- Headline: `<paste>`
- Thesis: `<paste>`

**Example 2 — `<company name>`**
- Decision: `<INVEST/WATCH/PASS>`, confidence `<n>`%
- Headline: `<paste>`
- Thesis: `<paste>`

---

## 6. What I would improve with more time

- **Verification pass**: a second LLM pass that cross-checks the extracted
  metrics against the raw source snippets before scoring, to catch
  extraction errors.
- **Structured financial data source** (e.g. a market-data API) for
  precise, point-in-time numbers instead of whatever web search surfaces.
- **Persistence**: save past reports (Postgres/Supabase) so a company can be
  re-analyzed and compared over time, and so multiple users can share a
  research history.
- **Human-in-the-loop**: let the person edit/challenge an extracted fact or
  risk before the scoring step runs, using LangGraph's interrupt/resume
  support.
- **Sector-specific scoring weights** — a SaaS company and a bank shouldn't
  be scored with the same weight distribution across the six dimensions.
- **Caching** identical company queries for a few hours to cut latency and
  API cost on repeat lookups.

---

## 7. AI usage disclosure

This project was built with extensive AI assistance (as the assignment
mandates), including architecture design, code generation, and debugging.
I've gone through the code and can explain any part of it — the agent graph,
the streaming mechanism, the scoring logic, and every component.

If included per the bonus instructions, chat session transcripts are in
`/chat-logs` (or attached separately) alongside this submission.

---

## Notes on ambiguity (per the ground rules)

Since the brief deliberately left "what it researches, how it works, how it
shows results" open, the calls I made and the reasoning behind them are
documented in §4 above rather than repeated here.
