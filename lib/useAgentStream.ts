"use client";

import { useRef, useState } from "react";
import type { AgentResult, ProgressEvent } from "@/src/agent/types";

export function useAgentStream() {
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

  return {
    events,
    result,
    error,
    running,
    runAgent,
  };
}
