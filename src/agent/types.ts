export interface SourceRef {
  title: string;
  url: string;
}

export interface ExtractedResearch {
  businessSummary: string;
  industryPosition: string;
  growthDrivers: string[];
  keyMetrics: { label: string; value: string }[];
  recentDevelopments: string[];
  competitors: string[];
  risks: string[];
}

export interface DimensionScores {
  financialHealth: number; // 0-10
  growth: number;
  moat: number;
  management: number;
  risk: number; // higher = safer (0-10, 10 = very low risk)
  valuation: number; // higher = more attractively valued
}

export type ScoreRationale = Record<string, string>;

export interface Review {
  missingRisks: string[];
  unsupportedClaims: string[];
  weakReasoningFlags: string[];
  completeness: number;
  reviewConfidence: number;
  verdict: "approved" | "needs_revision";
  revisionInstructions?: string;
}

export type Decision = "INVEST" | "WATCH" | "PASS";

export interface Verdict {
  decision: Decision;
  confidence: number; // 0-100
  headline: string;
  thesis: string;
  bullCase: string[];
  bearCase: string[];
  weightedScore: number; // 0-10
}

export interface AgentResult {
  companyName: string;
  resolvedIdentity: {
    fullName: string;
    sector: string;
    listingStatus: string;
    summary: string;
  };
  executiveSummary: string;
  research: ExtractedResearch;
  scores: DimensionScores;
  scoreRationale: ScoreRationale;
  review: Review;
  revisionCount: number;
  verdict: Verdict;
  sources: SourceRef[];
  generatedAt: string;
}

export type ProgressStage =
  | "identify"
  | "research_news"
  | "research_financials"
  | "research_competitors"
  | "extract"
  | "score"
  | "reviewer"
  | "revise"
  | "decide"
  | "generate_report"
  | "done"
  | "error";

export interface ProgressEvent {
  stage: ProgressStage;
  label: string;
  status: "started" | "completed" | "error";
  detail?: string;
  result?: AgentResult;
  error?: string;
}
