import { create } from "zustand";

export const useSessionStore = create((set) => ({
  transcript: [],
  ambiguities: [],
  resolved: [],

  addTranscript: (entry) =>
    set((s) => ({ transcript: [...s.transcript.slice(-100), entry] })),

  addAmbiguity: (flag) =>
    set((s) => ({ ambiguities: [flag, ...s.ambiguities] })),

  resolve: (quote) =>
    set((s) => ({
      ambiguities: s.ambiguities.filter((a) => a.quote !== quote),
      resolved: [...s.resolved, s.ambiguities.find((a) => a.quote === quote)],
    })),
}));
