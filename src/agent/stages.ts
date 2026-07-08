import type { ProgressStage } from "./types";

export const STAGES = [
  {
    id: "identify",
    order: 1,
    label: "Identifying company",
    timelineLabel: "Identify company",
  },
  {
    id: "research_news",
    order: 2,
    label: "Researching recent news",
    timelineLabel: "Scan recent news",
  },
  {
    id: "research_financials",
    order: 3,
    label: "Researching financials",
    timelineLabel: "Scan financials",
  },
  {
    id: "research_competitors",
    order: 4,
    label: "Researching competitive landscape",
    timelineLabel: "Scan competitive landscape",
  },
  {
    id: "extract",
    order: 5,
    label: "Synthesizing research into structured findings",
    timelineLabel: "Synthesize findings",
  },
  {
    id: "score",
    order: 6,
    label: "Scoring across 6 investment dimensions",
    timelineLabel: "Score investment dimensions",
  },
  {
    id: "decide",
    order: 7,
    label: "Forming final investment verdict",
    timelineLabel: "Form final verdict",
  },
] as const satisfies readonly {
  id: Exclude<ProgressStage, "done" | "error">;
  order: number;
  label: string;
  timelineLabel: string;
}[];

export const STAGE_LABELS: Record<string, string> = Object.fromEntries(
  [
    ...STAGES.map((stage) => [stage.id, stage.label]),
    ["reviewer", "Reviewing score rationale"],
    ["revise", "Revising scores from review"],
  ]
);
