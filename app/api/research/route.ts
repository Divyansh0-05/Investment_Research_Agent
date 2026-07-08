import { NextRequest } from "next/server";
import { mergeStateUpdate } from "@/lib/mergeStateUpdate";
import { buildInvestmentAgent, toAgentResult } from "@/src/agent/graph";
import { STAGE_LABELS } from "@/src/agent/stages";
import type { ProgressEvent } from "@/src/agent/types";

export const runtime = "nodejs";
export const maxDuration = 120;

function sseFormat(event: ProgressEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export async function POST(req: NextRequest) {
  const { companyName } = await req.json();

  if (!companyName || typeof companyName !== "string" || companyName.trim().length < 2) {
    return new Response(JSON.stringify({ error: "Please provide a valid company name." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!process.env.GOOGLE_API_KEY || !process.env.TAVILY_API_KEY) {
    return new Response(
      JSON.stringify({
        error:
          "Server is missing GOOGLE_API_KEY or TAVILY_API_KEY. Add them to .env.local (see README).",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: ProgressEvent) => controller.enqueue(encoder.encode(sseFormat(event)));

      try {
        const agent = buildInvestmentAgent();

        send({ stage: "identify", label: "Starting research agent", status: "started" });

        const accumulated: any = {
          companyName: companyName.trim(),
          sources: [],
        };

        const eventStream = await agent.stream(
          { companyName: companyName.trim() },
          { streamMode: "updates", recursionLimit: 50 }
        );

        for await (const chunk of eventStream) {
          for (const [nodeName, update] of Object.entries(chunk) as [string, any][]) {
            const label = STAGE_LABELS[nodeName] || nodeName;

            mergeStateUpdate(accumulated, update);

            send({
              stage: nodeName as ProgressEvent["stage"],
              label,
              status: "completed",
              detail: summarizeUpdate(nodeName, update),
            });
          }
        }

        const result = toAgentResult(accumulated);
        send({ stage: "done", label: "Report ready", status: "completed", result });
      } catch (err: any) {
        console.error("Agent error:", err);
        send({
          stage: "error",
          label: "Agent failed",
          status: "error",
          error: err?.message || "Unknown error occurred while running the agent.",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

function summarizeUpdate(nodeName: string, update: any): string | undefined {
  try {
    if (nodeName === "identify") return update.resolvedIdentity?.fullName;
    if (nodeName === "extract") return `${update.research?.keyMetrics?.length ?? 0} metrics extracted`;
    if (nodeName === "score") return undefined;
    if (nodeName === "decide") return update.verdict?.decision;
    return undefined;
  } catch {
    return undefined;
  }
}
