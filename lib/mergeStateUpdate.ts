import type { SourceRef } from "@/src/agent/types";

type AccumulatedState = Record<string, any> & {
  sources?: SourceRef[];
};

type StateUpdate = Record<string, any>;

const reducers: Record<string, (accumulated: AccumulatedState, value: any) => void> = {
  sources: (accumulated, value) => {
    if (Array.isArray(value)) {
      accumulated.sources = [...(accumulated.sources ?? []), ...value];
      return;
    }

    accumulated.sources = value;
  },
};

export function mergeStateUpdate(accumulated: AccumulatedState, update: StateUpdate) {
  for (const [key, value] of Object.entries(update)) {
    const reducer = reducers[key];

    if (reducer) {
      reducer(accumulated, value);
    } else {
      accumulated[key] = value;
    }
  }

  return accumulated;
}
