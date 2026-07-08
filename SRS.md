# Software Requirements Specification
## AI Investment Research Agent

**Version:** 1.0
**Prepared for:** InsideIIM × Altuni AI Labs — AI Product Development Engineer (Intern) Assignment
**Date:** July 2026

---

## 1. Introduction

### 1.1 Purpose
This document specifies the functional and non-functional requirements for
the AI Investment Research Agent — a web application that takes a company
name as input, autonomously researches the company, and produces an
investment recommendation (INVEST / WATCH / PASS) with supporting reasoning.

### 1.2 Scope
The system is a single-page web application backed by an AI agent pipeline.
It is a research and decision-support tool for demonstration purposes and is
explicitly **not** a licensed financial advisory product. In scope:

- Accepting a free-text company name as input
- Autonomously researching the company via live web search
- Extracting structured findings (metrics, news, competitors, risks)
- Scoring the company across defined investment dimensions
- Producing a final decision with a written thesis, bull case, and bear case
- Displaying the agent's reasoning process and cited sources

Out of scope:
- Real-time stock trading or brokerage integration
- Portfolio management or multi-company comparison
- User accounts, authentication, or saved history (v1)
- Regulatory-grade financial advice or compliance disclosures beyond a
  disclaimer

### 1.3 Intended Audience
Engineers evaluating this take-home submission; any user wanting a quick,
AI-generated research pass on a company before deeper due diligence.

### 1.4 Definitions
| Term | Meaning |
|---|---|
| Agent | The LangGraph.js state machine that orchestrates research, extraction, scoring, and decision nodes |
| Node | A single step in the agent graph (e.g. `identify`, `research_news`) |
| Verdict | The agent's final output: decision, confidence, thesis, bull/bear case |
| SSE | Server-Sent Events — the streaming mechanism used to push live progress to the browser |

---

## 2. Overall Description

### 2.1 Product Perspective
Standalone Next.js application. The frontend and backend are part of the
same deployable unit (Next.js App Router + Route Handlers). The agent logic
is isolated in its own module (`src/agent`) so the orchestration layer
(LangGraph.js) is decoupled from the transport layer (the API route) and the
presentation layer (React components).

### 2.2 Product Functions (Summary)
1. Accept a company name from the user.
2. Run a multi-step AI agent that researches and evaluates the company.
3. Stream live progress of the agent's execution to the browser.
4. Render a structured final report: verdict, scores, research findings,
   sources.

### 2.3 User Classes
- **Primary user**: anyone evaluating a company for investment interest —
  in this context, the assignment reviewer testing the tool.

### 2.4 Operating Environment
- Runs in any modern browser (Chrome, Edge, Firefox, Safari — last 2
  versions).
- Server: Node.js 18.18+, deployable to Vercel or any Node-compatible host.
- External dependencies: Google Gemini API (LLM), Tavily API (web search).

### 2.5 Assumptions and Dependencies
- The user provides valid API keys for Google Gemini and Tavily.
- Web search results are assumed to be a reasonable, if imperfect, proxy for
  ground-truth company data; the system does not verify claims against a
  primary financial data source.
- Company names are assumed to be resolvable to a real, identifiable entity;
  wholly fictional or extremely obscure names may produce a low-confidence
  or generic result rather than a hard failure.

---

## 3. Functional Requirements

| ID | Requirement | Priority |
|---|---|---|
| FR-1 | The system shall accept a company name via a text input field. | Must |
| FR-2 | The system shall reject empty or sub-2-character input with a clear error message. | Must |
| FR-3 | The system shall resolve the input to a specific company identity (full name, sector, listing status) before researching. | Must |
| FR-4 | The system shall research recent news, financial information, and competitive landscape for the identified company, using live web search. | Must |
| FR-5 | The system shall run the three research streams (news, financials, competitors) concurrently rather than sequentially. | Should |
| FR-6 | The system shall extract structured findings from raw research: business summary, key metrics, recent developments, competitors, and risks. | Must |
| FR-7 | The system shall not fabricate metrics or facts not present in the research; sparse data shall be reflected as such rather than invented. | Must |
| FR-8 | The system shall score the company on six dimensions (Financial Health, Growth, Competitive Moat, Management & Execution, Risk, Valuation), each on a 0–10 scale. | Must |
| FR-9 | The system shall compute a weighted overall score from the six dimension scores using fixed, documented weights. | Must |
| FR-10 | The system shall produce a final decision of INVEST, WATCH, or PASS, accompanied by a confidence percentage, a written thesis, and explicit bull-case and bear-case bullet points. | Must |
| FR-11 | The system shall stream the agent's step-by-step progress to the user interface in real time as each stage completes. | Should |
| FR-12 | The system shall display all sources (title + URL) used during research. | Must |
| FR-13 | The system shall display a disclaimer that output is AI-generated research, not financial advice. | Must |
| FR-14 | The system shall handle and surface agent/API failures gracefully in the UI rather than hanging indefinitely. | Must |
| FR-15 | The system shall provide example/preset companies for one-click testing. | Could |

---

## 4. Non-Functional Requirements

| ID | Requirement |
|---|---|
| NFR-1 (Performance) | A full research run should complete within ~60–90 seconds under normal network/API conditions. |
| NFR-2 (Reliability) | LLM output at every stage shall be schema-validated (structured output), not parsed from free text, to reduce malformed-response failures. |
| NFR-3 (Usability) | Progress must be visibly communicated during the run; the UI must never show a bare unexplained spinner for the full duration. |
| NFR-4 (Maintainability) | The LLM provider and model must be swappable by editing a single function, without touching graph or UI logic. |
| NFR-5 (Security) | API keys shall be read from server-side environment variables only and never exposed to the client bundle. |
| NFR-6 (Portability) | The application shall be deployable to Vercel with zero additional infrastructure. |
| NFR-7 (Auditability) | Every claim in the final verdict shall be traceable to the extracted research or scores that produced it (no unexplained numbers). |

---

## 5. System Architecture (Summary)

```
Browser (React UI)
   │ POST /api/research { companyName }, consumes SSE stream
   ▼
Next.js Route Handler (Node.js runtime)
   │ invokes and streams the LangGraph agent
   ▼
LangGraph.js StateGraph
   identify → [research_news ‖ research_financials ‖ research_competitors]
            → extract → score → decide
   │                              │
   ▼                              ▼
Tavily Search API          Google Gemini API
```

Full detail is in the project `README.md`, section 3 ("How it works").

---

## 6. Data Requirements

### 6.1 Input
- `companyName: string` — free text, 2+ characters.

### 6.2 Output (`AgentResult`)
- `resolvedIdentity` — full name, sector, listing status, summary
- `research` — business summary, key metrics, recent developments,
  competitors, risks
- `scores` — six dimension scores (0–10)
- `verdict` — decision, confidence, headline, thesis, bull case, bear case,
  weighted score
- `sources` — deduplicated list of `{ title, url }`
- `generatedAt` — ISO timestamp

No data is persisted between runs in v1; each request is stateless.

---

## 7. Constraints

- No paid/licensed financial data API is used (cost and access constraints
  for a 7-day assignment); web search is the research substrate, which is
  disclosed to the user.
- No user authentication or multi-tenant data isolation is implemented, as
  this is a single-user demonstration tool.

---

## 8. Future Enhancements (Out of Current Scope)

- Persistent history of past company analyses
- Verification pass cross-checking extracted metrics against raw sources
- Human-in-the-loop review before scoring (via LangGraph interrupt/resume)
- Sector-specific scoring weight profiles
- Structured financial data API integration for verified numeric metrics

---

## 9. Appendix — Traceability to Assignment Brief

| Assignment requirement | Where addressed |
|---|---|
| "Takes a company name, does its research" | FR-1, FR-3, FR-4 |
| "Decides whether to invest or pass — with reasoning" | FR-10 |
| "How it works under the hood... entirely up to you" | §5, README §4 (Key decisions & trade-offs) |
| Next.js + LangGraph.js stack | §2.4, §5 |
