import { Annotation, StateGraph, START, END } from "@langchain/langgraph";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { TavilySearch } from "@langchain/tavily";
import { z } from "zod";
import type {
  AgentResult,
  DimensionScores,
  ExtractedResearch,
  ScoreRationale,
  SourceRef,
  Verdict,
} from "./types";
export { STAGE_LABELS } from "./stages";

// ---------------------------------------------------------------------------
// State definition
// ---------------------------------------------------------------------------

const StateAnnotation = Annotation.Root({
  companyName: Annotation<string>(),
  resolvedIdentity: Annotation<{
    fullName: string;
    sector: string;
    listingStatus: string;
    summary: string;
  }>({ reducer: (_prev, next) => next, default: () => ({ fullName: "", sector: "", listingStatus: "", summary: "" }) }),
  newsRaw: Annotation<string>({ reducer: (_p, n) => n, default: () => "" }),
  financialsRaw: Annotation<string>({ reducer: (_p, n) => n, default: () => "" }),
  competitorsRaw: Annotation<string>({ reducer: (_p, n) => n, default: () => "" }),
  sources: Annotation<SourceRef[]>({
    reducer: (prev, next) => [...prev, ...next],
    default: () => [],
  }),
  research: Annotation<ExtractedResearch>({
    reducer: (_p, n) => n,
    default: () => ({
      businessSummary: "",
      keyMetrics: [],
      recentDevelopments: [],
      competitors: [],
      risks: [],
    }),
  }),
  scores: Annotation<DimensionScores>({
    reducer: (_p, n) => n,
    default: () => ({
      financialHealth: 5,
      growth: 5,
      moat: 5,
      management: 5,
      risk: 5,
      valuation: 5,
    }),
  }),
  scoreRationale: Annotation<ScoreRationale>({
    reducer: (_p, n) => n,
    default: () => ({}),
  }),
  verdict: Annotation<Verdict>({
    reducer: (_p, n) => n,
    default: () => ({
      decision: "WATCH",
      confidence: 0,
      headline: "",
      thesis: "",
      bullCase: [],
      bearCase: [],
      weightedScore: 0,
    }),
  }),
});

type AgentState = typeof StateAnnotation.State;

// ---------------------------------------------------------------------------
// Shared model + tools
// ---------------------------------------------------------------------------

function getModel(temperature = 0.2) {
  return new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    temperature,
    apiKey: process.env.GOOGLE_API_KEY,
  });
}

function getSearchTool(maxResults: number, topic: "general" | "news" | "finance" = "general") {
  return new TavilySearch({
    maxResults,
    topic,
    searchDepth: "advanced",
    tavilyApiKey: process.env.TAVILY_API_KEY,
  });
}

function formatSearchResults(raw: any): { text: string; sources: SourceRef[] } {
  const results = Array.isArray(raw?.results) ? raw.results : [];
  const sources: SourceRef[] = results.map((r: any) => ({
    title: r.title || r.url,
    url: r.url,
  }));
  const text = results
    .map(
      (r: any, i: number) =>
        `[${i + 1}] ${r.title}\n${r.content}\nSource: ${r.url}`
    )
    .join("\n\n");
  return { text: text || "No results found.", sources };
}

// ---------------------------------------------------------------------------
// Nodes
// ---------------------------------------------------------------------------

const IdentitySchema = z.object({
  fullName: z.string().describe("Full legal / commonly known company name"),
  sector: z.string().describe("Primary industry / sector"),
  listingStatus: z
    .string()
    .describe("e.g. 'Publicly listed on NSE/BSE', 'Publicly listed on NASDAQ', 'Private / VC-backed', 'Unknown'"),
  summary: z.string().describe("2-3 sentence plain-language summary of what the company does"),
});

async function identifyCompany(state: AgentState) {
  const model = getModel(0.1).withStructuredOutput(IdentitySchema);
  const result = await model.invoke([
    {
      role: "system",
      content:
        "You identify companies precisely for an investment research pipeline. If the name is ambiguous, pick the most prominent company that matches (e.g. a well-known startup or public company). Be concise and factual.",
    },
    { role: "user", content: `Company name provided by user: "${state.companyName}"` },
  ]);
  return { resolvedIdentity: result };
}

async function researchNews(state: AgentState) {
  const tool = getSearchTool(5, "news");
  const query = `${state.resolvedIdentity.fullName} latest news 2025 2026 funding earnings growth`;
  const raw = await tool.invoke({ query });
  const { text, sources } = formatSearchResults(raw);
  return { newsRaw: text, sources };
}

async function researchFinancials(state: AgentState) {
  const tool = getSearchTool(5, "finance");
  const query = `${state.resolvedIdentity.fullName} revenue growth profit margin valuation financials`;
  const raw = await tool.invoke({ query });
  const { text, sources } = formatSearchResults(raw);
  return { financialsRaw: text, sources };
}

async function researchCompetitors(state: AgentState) {
  const tool = getSearchTool(5, "general");
  const query = `${state.resolvedIdentity.fullName} competitors market position competitive advantage risks`;
  const raw = await tool.invoke({ query });
  const { text, sources } = formatSearchResults(raw);
  return { competitorsRaw: text, sources };
}

const ExtractionSchema = z.object({
  businessSummary: z.string().describe("3-4 sentence synthesis of the business and its current position"),
  keyMetrics: z
    .array(z.object({ label: z.string(), value: z.string() }))
    .describe("5-8 key financial/operational metrics found in the research, with label and value. If a metric is not available, omit it rather than guessing."),
  recentDevelopments: z.array(z.string()).describe("4-6 notable recent developments/news items"),
  competitors: z.array(z.string()).describe("3-6 key competitors"),
  risks: z.array(z.string()).describe("4-6 concrete risks or red flags found in the research"),
});

async function extractStructuredData(state: AgentState) {
  const model = getModel(0.1).withStructuredOutput(ExtractionSchema);
  const result = await model.invoke([
    {
      role: "system",
      content:
        "You are an equity research analyst. Extract only what is supported by the provided research snippets. Never invent numbers. If data is sparse, say so in businessSummary rather than fabricating metrics.",
    },
    {
      role: "user",
      content: `Company: ${state.resolvedIdentity.fullName} (${state.resolvedIdentity.sector})\n\n--- NEWS RESEARCH ---\n${state.newsRaw}\n\n--- FINANCIAL RESEARCH ---\n${state.financialsRaw}\n\n--- COMPETITIVE RESEARCH ---\n${state.competitorsRaw}`,
    },
  ]);
  return { research: result };
}

const ScoreSchema = z.object({
  financialHealth: z.number().min(0).max(10),
  growth: z.number().min(0).max(10),
  moat: z.number().min(0).max(10),
  management: z.number().min(0).max(10),
  risk: z.number().min(0).max(10).describe("10 = very low risk / very safe, 0 = very high risk"),
  valuation: z.number().min(0).max(10).describe("10 = very attractively valued, 0 = expensive/overvalued"),
  rationale: z.record(z.string()).describe("One short sentence justifying each score, keyed by dimension name"),
});

async function scoreDimensions(state: AgentState) {
  const model = getModel(0.2).withStructuredOutput(ScoreSchema);
  const result = await model.invoke([
    {
      role: "system",
      content:
        "You are a disciplined investment analyst scoring a company across 6 dimensions (0-10 each) based ONLY on the research provided. Be conservative: if evidence is thin, score near the middle (4-6) rather than extreme. Do not let hype in news override financial fundamentals.",
    },
    {
      role: "user",
      content: `Company: ${state.resolvedIdentity.fullName}\n\nBusiness summary: ${state.research.businessSummary}\n\nKey metrics: ${JSON.stringify(state.research.keyMetrics)}\n\nRecent developments: ${state.research.recentDevelopments.join("; ")}\n\nCompetitors: ${state.research.competitors.join(", ")}\n\nRisks: ${state.research.risks.join("; ")}`,
    },
  ]);
  const { rationale, ...scores } = result;
  return { scores: scores as DimensionScores, scoreRationale: rationale };
}

const VerdictSchema = z.object({
  decision: z.enum(["INVEST", "WATCH", "PASS"]),
  confidence: z.number().min(0).max(100),
  headline: z.string().describe("One punchy sentence summarizing the call"),
  thesis: z.string().describe("3-5 sentence investment thesis explaining the reasoning behind the decision"),
  bullCase: z.array(z.string()).describe("3-5 concrete bullet points supporting investing"),
  bearCase: z.array(z.string()).describe("3-5 concrete bullet points against investing / key risks"),
});

const WEIGHTS: Record<keyof DimensionScores, number> = {
  financialHealth: 0.25,
  growth: 0.2,
  moat: 0.2,
  management: 0.1,
  risk: 0.15,
  valuation: 0.1,
};

async function decideVerdict(state: AgentState) {
  const weightedScore =
    Object.entries(state.scores).reduce(
      (sum, [key, value]) => sum + value * (WEIGHTS[key as keyof DimensionScores] ?? 0),
      0
    ) / Object.values(WEIGHTS).reduce((a, b) => a + b, 0);

  const model = getModel(0.3).withStructuredOutput(VerdictSchema);
  const result = await model.invoke([
    {
      role: "system",
      content:
        "You are the final decision-maker on an investment committee. You have a computed weighted score (0-10) and dimension scores. Decide INVEST (strong, well-supported opportunity), WATCH (interesting but unresolved questions / wait for more data), or PASS (fundamental concerns outweigh the opportunity). Be honest and willing to say PASS or WATCH — do not default to INVEST. Ground every claim in the research provided; do not hallucinate specifics.",
    },
    {
      role: "user",
      content: `Company: ${state.resolvedIdentity.fullName}\nWeighted score (0-10): ${weightedScore.toFixed(2)}\nDimension scores: ${JSON.stringify(state.scores)}\nBusiness summary: ${state.research.businessSummary}\nRisks: ${state.research.risks.join("; ")}\nRecent developments: ${state.research.recentDevelopments.join("; ")}`,
    },
  ]);

  return { verdict: { ...result, weightedScore } };
}

// ---------------------------------------------------------------------------
// Graph assembly
// ---------------------------------------------------------------------------

export function buildInvestmentAgent() {
  const graph = new StateGraph(StateAnnotation)
    .addNode("identify", identifyCompany)
    .addNode("research_news", researchNews)
    .addNode("research_financials", researchFinancials)
    .addNode("research_competitors", researchCompetitors)
    .addNode("extract", extractStructuredData)
    .addNode("score", scoreDimensions)
    .addNode("decide", decideVerdict)
    .addEdge(START, "identify")
    .addEdge("identify", "research_news")
    .addEdge("identify", "research_financials")
    .addEdge("identify", "research_competitors")
    .addEdge("research_news", "extract")
    .addEdge("research_financials", "extract")
    .addEdge("research_competitors", "extract")
    .addEdge("extract", "score")
    .addEdge("score", "decide")
    .addEdge("decide", END);

  return graph.compile();
}

export function dedupeSources(sources: SourceRef[]): SourceRef[] {
  const seen = new Set<string>();
  const out: SourceRef[] = [];
  for (const s of sources) {
    if (!seen.has(s.url)) {
      seen.add(s.url);
      out.push(s);
    }
  }
  return out.slice(0, 12);
}

export function toAgentResult(state: AgentState): AgentResult {
  return {
    companyName: state.companyName,
    resolvedIdentity: state.resolvedIdentity,
    research: state.research,
    scores: state.scores,
    scoreRationale: state.scoreRationale,
    verdict: state.verdict,
    sources: dedupeSources(state.sources),
    generatedAt: new Date().toISOString(),
  };
}
