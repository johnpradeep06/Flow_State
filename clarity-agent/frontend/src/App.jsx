import { useState, useEffect } from "react";
import { useSessionStore } from "./store/sessionStore";
import { useWebSocket } from "./hooks/useWebSocket";
import AmbiguityCard from "./components/AmbiguityCard";
import TranscriptFeed from "./components/TranscriptFeed";
import SessionControls from "./components/SessionControls";
import AgentTraceHub from "./components/AgentTraceHub";
import { Activity, AlertCircle, CheckCircle2, ChevronLeft } from "lucide-react";
import { Routes, Route, useNavigate, Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import { db } from "./firebase";
import { doc, updateDoc } from "firebase/firestore";

import LoginPage from "./pages/LoginPage";
import CompanyPortal from "./pages/CompanyPortal";
import ProjectPortal from "./pages/ProjectPortal";
import MeetingPortal from "./pages/MeetingPortal";
import ReportPage from "./pages/ReportPage";

function Dashboard() {
  const apiBase = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
  const [running, setRunning] = useState(false);
  const { 
    transcript, 
    ambiguities, 
    resolved, 
    addTranscript, 
    addAmbiguity, 
    resolve, 
    setReport,
    updateAgentState,
    companyId,
    projectId,
    activeMeetingId
  } = useSessionStore();
  const navigate = useNavigate();



  const startSession = async (meetUrl, webhookUrl, customerName) => {
    try {
      // Fully purge store state on boot
      useSessionStore.setState({ 
        transcript: [], 
        ambiguities: [], 
        resolved: [], 
        report: null,
        agentStates: {} 
      });
      
      await fetch(`${apiBase}/session/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          meet_url: meetUrl, 
          webhook_url: webhookUrl,
          customer_name: customerName 
        }),
      });
      setRunning(true);
    } catch (err) {
      console.error("Failed to start session", err);
    }
  };

  const stopSession = async () => {
    try {
      setRunning(false);
      
      // 🚨 PRE-CLOSE BACKUP: Archive live transcripts and unresolved matrix items instantly
      if (companyId && projectId && activeMeetingId) {
        try {
          const meetRef = doc(db, "companies", companyId, "projects", projectId, "meetings", activeMeetingId);
          await updateDoc(meetRef, {
            transcript: transcript || [],
            ambiguities: ambiguities || [],
            resolved: resolved || []
          });
          console.log("📌 Captured intermediate live transcript stream checkpoint.");
        } catch (err) {
          console.error("❌ Live snapshot capture aborted:", err);
        }
      }

      // Forward user to their isolated boardroom dashboard
      navigate(`/c/${companyId}/p/${projectId}/report/${activeMeetingId}`); 
      await fetch(`${apiBase}/session/stop`, { method: "POST" });
    } catch (err) {
      console.error("Failed to stop session", err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 min-h-screen lg:h-screen flex flex-col lg:overflow-hidden select-none selection:bg-indigo-500/30 relative text-white">
      <div className="ambient-mesh" />
      
      {/* High-End Minimal Header */}
      <header className="mb-5 flex items-center gap-4">
        <button 
          onClick={() => navigate(`/c/${companyId}/p/${projectId}`)}
          className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.06] hover:text-white text-slate-400 transition-all cursor-pointer group shadow-sm mr-1 shrink-0"
          title="Exit Workspace"
        >
          <ChevronLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
        </button>
        <div className="relative">
          <div className="absolute -inset-1.5 bg-gradient-to-tr from-indigo-500 to-sky-400 rounded-xl blur opacity-20 animate-pulse" />
          <div className="relative bg-obsidian/90 border border-white/10 p-2.5 rounded-xl text-indigo-400 shadow-inner flex items-center justify-center">
            <Activity size={20} />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent leading-tight">
              ClarityOS
            </h1>
            <span className="text-[9px] font-black tracking-widest uppercase bg-white/5 border border-white/10 text-indigo-300 px-1.5 py-0.5 rounded">
              WORKSPACE v2.0
            </span>
          </div>
          <p className="text-gray-500 text-[11px] tracking-wide uppercase font-medium">
            Live Swarm Elicitation Matrix
          </p>
        </div>
      </header>

      {/* Unified Session Controller */}
      <SessionControls onStart={startSession} onStop={stopSession} running={running} />

      {/* Real-time Agent Engine State Bar */}
      <AgentTraceHub />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 lg:min-h-0">
        
        {/* LEFT CAPTIONS HUB */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-surface/50 backdrop-blur border border-white/5 rounded-2xl p-6 flex flex-col shadow-xl min-h-[400px] lg:min-h-0 relative overflow-hidden group"
        >
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-indigo-500/5 via-indigo-500/20 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
            <h2 className="text-sm font-bold text-gray-300 flex items-center gap-2 uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
              Transcription Feed
            </h2>
            {running && (
              <span className="flex items-center gap-1.5 text-rose-400 text-[10px] font-black uppercase tracking-widest bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                Broadcasting
              </span>
            )}
          </div>
          
          <div className="flex-1 overflow-hidden relative">
            <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-surface/80 via-surface/50 to-transparent z-10 pointer-events-none" />
            <TranscriptFeed transcript={transcript} />
            <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-surface/80 via-surface/50 to-transparent z-10 pointer-events-none" />
          </div>
        </motion.div>

        {/* RIGHT INTELLIGENCE PIPELINE */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white/[0.01] border border-white/[0.06] backdrop-blur-md rounded-3xl px-6 pb-6 pt-0 overflow-y-auto shadow-[0_8px_30px_rgba(0,0,0,0.12)] relative custom-scrollbar min-h-[400px] lg:min-h-0"
        >
          <div className="sticky top-0 bg-surface/90 backdrop-blur-xl pt-6 pb-4 mb-5 border-b border-white/[0.06] z-20 flex items-center justify-between">
            <div>
              <h2 className="text-xs font-extrabold text-white tracking-[0.15em] uppercase flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                  <AlertCircle size={12} />
                </div>
                Ambiguity Matrix
              </h2>
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] mt-2.5 text-slate-500 pl-1">
                <CheckCircle2 size={12} className="text-emerald-500/80" />
                <span>{resolved.length} Neutralized</span>
              </div>
            </div>
            
            <div className="bg-white/[0.02] text-slate-400 border border-white/[0.08] rounded-lg text-[9px] font-bold uppercase tracking-[0.15em] px-2.5 py-1 font-mono shadow-sm shrink-0 select-none">
              {ambiguities.length} Flags
            </div>
          </div>

          <AnimatePresence mode="popLayout">
            {ambiguities.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-48 flex flex-col items-center justify-center text-gray-500"
              >
                <motion.div
                  animate={{ scale: [1, 1.05, 1], opacity: [0.2, 0.3, 0.2] }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  <AlertCircle size={36} className="mb-3" />
                </motion.div>
                <p className="text-xs tracking-wide font-semibold text-gray-500 uppercase">Swarm Engine Silent</p>
                <p className="text-[10px] text-gray-600 mt-0.5">Awaiting outstanding customer vagueness</p>
              </motion.div>
            ) : (
              <motion.div layout className="space-y-3.5 pb-4">
                {[...ambiguities].reverse().map((flag) => (
                  <AmbiguityCard key={flag.quote} flag={flag} onResolve={resolve} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

      </div>
    </div>
  );
}

// Global Higher-Order Component to protect workspace routes
function ProtectedRoute({ children }) {
  const { user } = useSessionStore();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  const { 
    addTranscript, 
    addAmbiguity, 
    updateAgentState, 
    setReport,
    companyId,
    projectId,
    activeMeetingId
  } = useSessionStore();

  // Keep WebSocket active globally so incoming streams persist during transitions
  useWebSocket(async (msg) => {
    if (msg.type === "transcript") {
      addTranscript(msg.data);
    }
    if (msg.type === "ambiguity") {
      addAmbiguity(msg.data);
    }
    if (msg.type === "agent_status") {
      updateAgentState(msg.data.agent, msg.data.status, msg.data.state);
    }
    
    if (msg.type === "session_report") {
      // Load immediate analysis payload into Zustand
      setReport(msg.data);

      // 🚀 CRITICAL PERSISTENCE TUNNEL: Sync consolidated artifacts back to Firestore
      try {
        // Always grab the freshest reference values straight from the store engine!
        const currentStore = useSessionStore.getState();
        const cid = currentStore.companyId;
        const pid = currentStore.projectId;
        const mid = currentStore.activeMeetingId;

        if (cid && pid && mid) {
          const meetRef = doc(db, "companies", cid, "projects", pid, "meetings", mid);
          await updateDoc(meetRef, {
            status: "completed",
            report: msg.data,
            transcript: currentStore.transcript || [],
            ambiguities: currentStore.ambiguities || [],
            resolved: currentStore.resolved || []
          });
          console.log("✅ Firestore Backup Bridge executed successfully!");
        } else {
          console.warn("⚠️ Could not sync backup: missing context ids in session store.", { cid, pid, mid });
        }
      } catch (err) {
        console.error("❌ Firestore synchronizer execution crashed:", err);
      }
    }
  });

  return (
    <Routes>
      {/* Identity Access Nodes */}
      <Route path="/login" element={<LoginPage />} />

      {/* Tenant Workspaces - Protected Root Matrix */}
      <Route path="/" element={
        <ProtectedRoute>
          <CompanyPortal />
        </ProtectedRoute>
      } />

      {/* Specific Corporate Deliverables Grid */}
      <Route path="/c/:companyId" element={
        <ProtectedRoute>
          <ProjectPortal />
        </ProtectedRoute>
      } />

      {/* Chronicled Meetings Stream */}
      <Route path="/c/:companyId/p/:projectId" element={
        <ProtectedRoute>
          <MeetingPortal />
        </ProtectedRoute>
      } />

      {/* Live Swarm Monitoring Portal */}
      <Route path="/c/:companyId/p/:projectId/live" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />

      {/* Dynamic/Static Autonomous Boardroom Report */}
      <Route path="/c/:companyId/p/:projectId/report/:meetingId" element={
        <ProtectedRoute>
          <ReportPage />
        </ProtectedRoute>
      } />

      {/* Catch-All Safe Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
