import { create } from "zustand";
import { persist } from "zustand/middleware";
import { db } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";

export const useSessionStore = create(
  persist(
    (set) => ({
      user: null,
      companyId: null,
      projectId: null,
      activeMeetingId: null,
      meetingTitle: "",

      transcript: [],
      ambiguities: [],
      resolved: [],
      report: null,
      agentStates: {}, // tracks { agentName: { status: "...", state: "idle|running|success" } }

      setUser: (u) => set({ user: u }),
      setNavContext: (cid, pid) => set({ companyId: cid, projectId: pid }),
      setActiveMeeting: (mid, mTitle) => set({ activeMeetingId: mid, meetingTitle: mTitle }),

      addTranscript: (entry) =>
        set((s) => ({ transcript: [...s.transcript.slice(-100), entry] })),

      addAmbiguity: async (flag) => {
        // 1. Optimistically render in state
        set((s) => ({ ambiguities: [flag, ...s.ambiguities] }));

        // 2. Push to Cloud Background
        const store = useSessionStore.getState();
        if (store.companyId && store.projectId && store.activeMeetingId) {
          try {
            const meetRef = doc(db, "companies", store.companyId, "projects", store.projectId, "meetings", store.activeMeetingId);
            await updateDoc(meetRef, { ambiguities: store.ambiguities });
            console.log("🔥 Ambiguity detection written to Cloud Registry.");
          } catch (err) {
            console.error("Firebase write failed for new ambiguity:", err);
          }
        }
      },

      setReport: (data) => set({ report: data }),

      updateAgentState: (agent, status, state) =>
        set((s) => ({
          agentStates: {
            ...s.agentStates,
            [agent]: { status, state }
          }
        })),

      resolve: async (quote) => {
        // Optimistically update local UI state
        set((s) => ({
          ambiguities: s.ambiguities.filter((a) => a.quote !== quote),
          resolved: [...s.resolved, s.ambiguities.find((a) => a.quote === quote)].filter(Boolean),
        }));

        const store = useSessionStore.getState();

        // Cloud persistence for cleared/neutralized ambiguity
        if (store.companyId && store.projectId && store.activeMeetingId) {
          try {
            const meetRef = doc(db, "companies", store.companyId, "projects", store.projectId, "meetings", store.activeMeetingId);
            await updateDoc(meetRef, {
              ambiguities: store.ambiguities,
              resolved: store.resolved
            });
            console.log("🔥 Ambiguity neutralization backed up to Cloud Registry.");
          } catch (err) {
            console.error("Firebase write failed during ambiguity resolution:", err);
          }
        }

        // Sync back to local backend for mathematical clarity scoring
        try {
          await fetch("http://localhost:8000/session/resolve", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ quote })
          });
        } catch (err) {
          console.error("Failed to sync resolved ambiguity to backend", err);
        }
      },
    }),
    {
      name: "clarity-os-store", // LocalStorage persistence key
      partialize: (state) => ({
        // We selectively persist these values so we survive refreshes
        user: state.user,
        companyId: state.companyId,
        projectId: state.projectId,
        activeMeetingId: state.activeMeetingId,
        meetingTitle: state.meetingTitle,
        report: state.report,
        transcript: state.transcript,
        ambiguities: state.ambiguities,
        resolved: state.resolved
      }),
    }
  )
);
