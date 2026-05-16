import { useState, useEffect } from "react";
import { useSessionStore } from "../store/sessionStore";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { 
  ChevronLeft, 
  FileText, 
  CheckCircle2, 
  Calendar, 
  Clock, 
  TrendingUp, 
  Award, 
  Layers, 
  Zap, 
  ShieldCheck,
  Loader2,
  UserRound,
  Send,
  MessageSquareText,
  Sparkles,
  Brain,
  ShieldAlert,
  Cpu,
  Terminal,
  Activity
} from "lucide-react";

export default function ReportPage() {
  const navigate = useNavigate();
  const report = useSessionStore((s) => s.report);
  const { companyId: urlCid, projectId: urlPid, meetingId: urlMid } = useParams();
  const { 
    companyId, 
    projectId, 
    activeMeetingId, 
    transcript, 
    ambiguities, 
    resolved,
    setNavContext,
    setActiveMeeting
  } = useSessionStore();

  const [activeTab, setActiveTab] = useState("summary");

  // Digital Replicant Interactive Chat State
  const [chatHistory, setChatHistory] = useState([
    { role: "bot", text: `Welcome! I am a behavioral simulation of your client, compiled from our session transcript. You can pitch ideas, ask about my priorities, or clarify preferences offline.` }
  ]);
  const [inputMsg, setInputMsg] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Deep-Sync Hydration: Pull full historical context if missing or on refresh
  useEffect(() => {
    const hydrateReport = async () => {
      const cid = urlCid || companyId;
      const pid = urlPid || projectId;
      const mid = urlMid || activeMeetingId;

      if (cid && pid && mid) {
        try {
          // Sync store with URL if they differ (e.g. on direct link or refresh)
          if (cid !== companyId || pid !== projectId) setNavContext(cid, pid);
          if (mid !== activeMeetingId) setActiveMeeting(mid, "Historical Session");

          const snap = await getDoc(doc(db, "companies", cid, "projects", pid, "meetings", mid));
          if (snap.exists()) {
            const data = snap.data();
            
            // Hydrate chat history
            if (data.chatHistory?.length > 0) setChatHistory(data.chatHistory);
            
            // Hydrate main session store for historical view
            useSessionStore.setState({
              report: data.report || null,
              transcript: data.transcript || [],
              ambiguities: data.ambiguities || [],
              resolved: data.resolved || []
            });
          }
        } catch(e) {
          console.error("Failed to hydrate boardroom report:", e);
        }
      }
    };
    hydrateReport();
  }, [urlCid, urlPid, urlMid, companyId, projectId, activeMeetingId]);

  const syncChatToFirestore = async (historyPayload) => {
    if (companyId && projectId && activeMeetingId) {
      try {
        const ref = doc(db, "companies", companyId, "projects", projectId, "meetings", activeMeetingId);
        await updateDoc(ref, { chatHistory: historyPayload });
      } catch (err) {
        console.error("Chat persistence error:", err);
      }
    }
  };

  const handleSendChat = async () => {
    if (!inputMsg.trim() || !report?.persona) return;
    
    const payloadMsg = inputMsg;
    setInputMsg("");
    const userHistory = [...chatHistory, { role: "user", text: payloadMsg }];
    setChatHistory(userHistory);
    syncChatToFirestore(userHistory);
    setIsTyping(true);
    
    try {
      const res = await fetch("http://localhost:8000/session/persona/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: payloadMsg,
          persona: report.persona
        })
      });
      const data = await res.json();
      const botHistory = [...userHistory, { role: "bot", text: data.reply }];
      setChatHistory(botHistory);
      syncChatToFirestore(botHistory);
    } catch (err) {
      const errorHistory = [...userHistory, { role: "bot", text: "[Sync Error] Digital clone is unresponsive. Ensure backend is running." }];
      setChatHistory(errorHistory);
      syncChatToFirestore(errorHistory);
    } finally {
      setIsTyping(false);
    }
  };

  const agentStates = useSessionStore((s) => s.agentStates || {});

  // Loading or null state safeguard: IMMERSIVE ORCHESTRATOR
  if (!report) {
    const agentsList = [
      {
        id: "ClarityScorer",
        name: "ClarityScorer",
        title: "Quantitative Evaluator",
        desc: "Analyzing metric markers, densities, and resolution velocities...",
        icon: Activity
      },
      {
        id: "RequirementsArchitect",
        name: "RequirementsArchitect",
        title: "Requirements Architect",
        desc: "Parsing entire transcript to synthesize functional & non-functional specs...",
        icon: Layers
      },
      {
        id: "ChiefHistorian",
        name: "ChiefHistorian",
        title: "Chief Historian",
        desc: "Drafting executive narratives and tabulating assigned deliverable trackers...",
        icon: FileText
      },
      {
        id: "ProfileReplicator",
        name: "ProfileReplicator",
        title: "Persona Profiler",
        desc: "Harvesting customer preferences, worries, and communication style DNA...",
        icon: Brain
      }
    ];

    return (
      <div className="min-h-screen flex flex-col bg-obsidian text-white p-6 md:p-12 select-none relative overflow-hidden selection:bg-indigo-500/30 font-sans">
        {/* Dynamic Premium Mesh Gradient Backgrounds */}
        <div className="absolute top-[-20%] left-[50%] translate-x-[-50%] w-[800px] h-[400px] bg-gradient-to-b from-indigo-500/10 via-purple-500/5 to-transparent blur-[120px] rounded-full pointer-events-none"></div>
        
        <header className="max-w-5xl mx-auto w-full mb-10 flex items-center justify-between z-10 relative">
          <div className="flex items-center gap-2 bg-white/[0.03] border border-white/5 px-3 py-1 rounded-full backdrop-blur-md shadow-lg">
            <Cpu size={12} className="text-purple-400 animate-pulse" />
            <span className="text-[10px] tracking-[0.15em] font-mono uppercase text-gray-400 font-semibold">Stage 2 Boardroom Actively Synthesizing</span>
          </div>
        </header>

        <main className="max-w-4xl mx-auto w-full flex-1 flex flex-col justify-center z-10 relative pb-16">
          
          <div className="mb-10 text-left">
            <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-white via-white to-white/40 bg-clip-text text-transparent leading-tight mb-3">
              Assembling Requirements
            </h1>
            <p className="text-[15px] text-gray-400 max-w-lg leading-relaxed">
              Multiple autonomous agents are researching, validating, and building artifacts from your meeting data. This takes roughly 10-15 seconds.
            </p>
          </div>

          {/* Agent Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
            {agentsList.map((ag, idx) => {
              const st = agentStates[ag.name] || { state: "idle", status: "Listening for channel trigger..." };
              const isActive = st.state === "running";
              const isDone = st.state === "success";
              const IconComp = ag.icon;

              return (
                <motion.div 
                  key={ag.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: idx * 0.08 }}
                  className={`p-5 rounded-3xl border backdrop-blur-xl shadow-xl flex gap-4 relative overflow-hidden transition-all duration-500 ${
                    isActive 
                      ? "bg-indigo-500/[0.03] border-indigo-500/30 shadow-[0_0_40px_rgba(99,102,241,0.03)] scale-[1.01]" 
                      : isDone
                      ? "bg-emerald-500/[0.01] border-emerald-500/20 shadow-none"
                      : "bg-white/[0.01] border-white/[0.06]"
                  }`}
                >
                  {/* Glowing track indicator */}
                  {isActive && (
                    <div className="absolute inset-y-0 left-0 w-[3px] bg-indigo-500 rounded-full animate-pulse"></div>
                  )}
                  
                  <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 transition-all duration-500 ${
                    isActive 
                      ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]" 
                      : isDone 
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                      : "bg-white/[0.03] border-white/[0.06] text-gray-500"
                  }`}>
                    {isDone ? (
                      <CheckCircle2 size={20} className="animate-in zoom-in-75 duration-300" />
                    ) : isActive ? (
                      <IconComp size={18} className="animate-pulse" />
                    ) : (
                      <IconComp size={18} className="opacity-40" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className={`font-bold text-[14px] tracking-wide ${isDone ? "text-gray-300" : "text-white"}`}>
                        {ag.title}
                      </h3>
                      <span className={`text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-md border font-bold ${
                        isDone 
                          ? "bg-emerald-500/5 text-emerald-400 border-emerald-500/10" 
                          : isActive 
                          ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20 animate-pulse" 
                          : "bg-white/5 text-gray-500 border-white/5"
                      }`}>
                        {isDone ? "RESOLVED" : isActive ? "RESEARCHING" : "QUEUED"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed mb-3">
                      {ag.desc}
                    </p>
                    
                    {/* Micro Console */}
                    <div className="flex items-center gap-2 text-[10px] font-mono truncate bg-obsidian border border-white/[0.04] rounded-xl px-3 py-2 text-gray-400 shadow-inner">
                      <Terminal size={11} className={`shrink-0 ${isActive ? "text-indigo-400 animate-pulse" : isDone ? "text-emerald-400" : "text-gray-600"}`} />
                      <span className={`truncate ${isActive ? "text-indigo-300" : isDone ? "text-emerald-400" : "text-gray-600"}`}>
                        {st.status}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <button 
            onClick={() => navigate(`/c/${companyId}/p/${projectId}/live`)}
            className="mt-12 text-xs text-gray-500 hover:text-slate-300 font-medium transition-colors flex items-center gap-1.5 mx-auto bg-white/[0.02] border border-white/[0.05] px-4 py-2 rounded-full backdrop-blur hover:bg-white/[0.04]"
          >
            <ChevronLeft size={14} /> Return to Meeting
          </button>

        </main>
      </div>
    );
  }

  const { clarity, requirements, summary } = report;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="max-w-7xl mx-auto p-6 md:p-10 min-h-screen flex flex-col text-white selection:bg-indigo-500/30 font-sans relative"
    >
      {/* Header & Navigation */}
      <header className="mb-8 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/c/${companyId}/p/${projectId}`)}
            className="p-2 hover:bg-white/5 active:bg-white/10 border border-white/5 rounded-xl transition-all duration-200 group"
          >
            <ChevronLeft className="group-hover:-translate-x-0.5 transition-transform" size={20} />
          </button>
          <div>
            <span className="text-[10px] font-bold tracking-widest uppercase text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20 inline-block mb-1.5">
              Boardroom Synthesis Active
            </span>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-white/90 to-white/50 bg-clip-text text-transparent">
              Session Artifacts
            </h1>
          </div>
        </div>

        {/* Small Summary Gauge on Header */}
        <div className="flex items-center gap-3 bg-surface border border-white/5 rounded-2xl p-3 px-4">
          <div className="text-right">
            <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Clarity Grade</div>
            <div className="text-sm font-bold flex items-center justify-end gap-1">
              <Award className="text-emerald-400" size={14} />
              Grade {clarity.grade}
            </div>
          </div>
          <div className="w-[1px] h-8 bg-white/10"></div>
          <div className="font-black text-2xl bg-gradient-to-br from-emerald-400 to-teal-500 bg-clip-text text-transparent">
            {clarity.score}%
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="flex gap-1.5 bg-surface/50 backdrop-blur border border-white/5 p-1 rounded-xl mb-8 max-w-xl">
        <button
          onClick={() => setActiveTab("summary")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-200 ${
            activeTab === "summary"
              ? "bg-surface text-white shadow-lg border border-white/10"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <FileText size={15} />
          Summary
        </button>
        <button
          onClick={() => setActiveTab("transcript")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-200 ${
            activeTab === "transcript"
              ? "bg-surface text-white shadow-lg border border-white/10"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <MessageSquareText size={15} className="text-sky-400" />
          Logs
        </button>
        <button
          onClick={() => setActiveTab("specs")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-200 ${
            activeTab === "specs"
              ? "bg-surface text-white shadow-lg border border-white/10"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Layers size={15} />
          PRD Specs
        </button>
        <button
          onClick={() => setActiveTab("clarity")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-200 ${
            activeTab === "clarity"
              ? "bg-surface text-white shadow-lg border border-white/10"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <TrendingUp size={15} />
          Clarity
        </button>
        <button
          onClick={() => setActiveTab("replicant")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-200 ${
            activeTab === "replicant"
              ? "bg-surface text-white shadow-lg border border-white/10"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Sparkles size={15} className="text-purple-400" />
          Clone Sandbox
        </button>
      </nav>

      {/* MAIN CONTENT ACCORDING TO TAB */}
      <main className="flex-1 relative min-h-[60vh]">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: EXECUTIVE SUMMARY */}
          {activeTab === "summary" && (
            <motion.div 
              key="summary"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              {/* Executive Narrative */}
              <section className="bg-white/[0.01] border border-white/[0.06] rounded-3xl p-6 md:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.12)] backdrop-blur-md relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent"></div>
                <h2 className="text-sm font-bold tracking-widest uppercase mb-4 flex items-center gap-2 text-indigo-400/90">
                  Executive Narrative
                </h2>
                <p className="text-slate-200 leading-relaxed text-[15px] md:text-[16px] max-w-4xl">
                  {summary.summary_paragraph}
                </p>
              </section>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Key Decisions */}
                <section className="bg-white/[0.01] border border-white/[0.06] rounded-3xl p-6 md:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.12)] backdrop-blur-md relative overflow-hidden flex flex-col">
                  <h2 className="text-sm font-bold tracking-widest uppercase mb-5 flex items-center gap-2 text-emerald-400/90 pb-3 border-b border-white/[0.04]">
                    <CheckCircle2 size={16} className="text-emerald-400" /> Key Decisions & Mandates
                  </h2>
                  <ul className="space-y-4 flex-1">
                    {summary.decisions.length === 0 ? (
                      <li className="text-slate-500 text-sm italic flex items-center h-full justify-center">No explicit mandates identified during this session.</li>
                    ) : (
                      summary.decisions.map((dec, idx) => (
                        <li key={idx} className="flex gap-3 text-[14px] text-slate-300 leading-relaxed group">
                          <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5 group-hover:bg-emerald-500/20 transition-colors">
                            <CheckCircle2 size={12} />
                          </div>
                          <span>{dec}</span>
                        </li>
                      ))
                    )}
                  </ul>
                </section>

                {/* Action Items List */}
                <section className="bg-white/[0.01] border border-white/[0.06] rounded-3xl p-6 md:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.12)] backdrop-blur-md relative overflow-hidden">
                  <h2 className="text-sm font-bold tracking-widest uppercase mb-5 flex items-center gap-2 text-orange-400/90 pb-3 border-b border-white/[0.04]">
                    <Calendar size={16} className="text-orange-400" /> Ownership & Actions
                  </h2>
                  <div className="space-y-4">
                    {summary.action_items.length === 0 ? (
                      <div className="py-8 text-center text-slate-500 text-sm italic">No distinct deliverables detected.</div>
                    ) : (
                      summary.action_items.map((item, idx) => (
                        <div key={idx} className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-white/[0.08] transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500/20 to-red-500/10 border border-orange-500/20 flex items-center justify-center text-[11px] font-bold text-orange-300">
                              {item.who.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-400 tracking-wide uppercase leading-none mb-1">{item.who}</div>
                              <div className="text-[14px] text-slate-200 leading-tight font-medium">{item.what}</div>
                            </div>
                          </div>
                          <div className="shrink-0">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[11px] text-slate-400 font-mono font-medium">
                              <Clock size={11} className="text-orange-400/80" /> {item.by_when}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              </div>
            </motion.div>
          )}

          {/* TAB 2: TECHNICAL SPECIFICATIONS */}
          {activeTab === "specs" && (
            <motion.div 
              key="specs"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[55vh]"
            >
              {/* Features Column */}
              <section className="bg-white/[0.01] border border-white/[0.06] rounded-3xl p-6 flex flex-col shadow-[0_8px_30px_rgba(0,0,0,0.12)] backdrop-blur-md">
                <div className="mb-5 pb-3 border-b border-white/[0.04] flex items-center gap-2 text-indigo-400/90">
                  <Layers size={16} className="text-indigo-400" />
                  <h2 className="text-xs font-bold tracking-widest uppercase">Scope & Features</h2>
                </div>
                <div className="space-y-3 flex-1 overflow-y-auto max-h-[60vh] custom-scrollbar pr-1">
                  {requirements.features.map((item, idx) => (
                    <div key={idx} className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-3 text-[13px] text-slate-200 leading-relaxed hover:border-white/[0.08] hover:bg-white/[0.03] transition-all duration-300">
                      {item}
                    </div>
                  ))}
                  {requirements.features.length === 0 && <div className="text-slate-500 text-xs italic p-2">No features detected.</div>}
                </div>
              </section>

              {/* Functional Requirements Column */}
              <section className="bg-white/[0.01] border border-white/[0.06] rounded-3xl p-6 flex flex-col shadow-[0_8px_30px_rgba(0,0,0,0.12)] backdrop-blur-md">
                <div className="mb-5 pb-3 border-b border-white/[0.04] flex items-center gap-2 text-emerald-400/90">
                  <Zap size={16} className="text-emerald-400" />
                  <h2 className="text-xs font-bold tracking-widest uppercase">Functional Reqs</h2>
                </div>
                <div className="space-y-3 flex-1 overflow-y-auto max-h-[60vh] custom-scrollbar pr-1">
                  {requirements.functional_reqs.map((item, idx) => (
                    <div key={idx} className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-3 text-[13px] text-slate-200 leading-relaxed hover:border-white/[0.08] hover:bg-white/[0.03] transition-all duration-300">
                      {item}
                    </div>
                  ))}
                  {requirements.functional_reqs.length === 0 && <div className="text-slate-500 text-xs italic p-2">None detected.</div>}
                </div>
              </section>

              {/* Non-Functional Requirements Column */}
              <section className="bg-white/[0.01] border border-white/[0.06] rounded-3xl p-6 flex flex-col shadow-[0_8px_30px_rgba(0,0,0,0.12)] backdrop-blur-md">
                <div className="mb-5 pb-3 border-b border-white/[0.04] flex items-center gap-2 text-orange-400/90">
                  <ShieldCheck size={16} className="text-orange-400" />
                  <h2 className="text-xs font-bold tracking-widest uppercase">Non-Functional</h2>
                </div>
                <div className="space-y-3 flex-1 overflow-y-auto max-h-[60vh] custom-scrollbar pr-1">
                  {requirements.non_functional_reqs.map((item, idx) => (
                    <div key={idx} className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-3 text-[13px] text-slate-200 leading-relaxed hover:border-white/[0.08] hover:bg-white/[0.03] transition-all duration-300">
                      {item}
                    </div>
                  ))}
                  {requirements.non_functional_reqs.length === 0 && <div className="text-slate-500 text-xs italic p-2">None detected.</div>}
                </div>
              </section>
            </motion.div>
          )}

          {/* TAB 3: CLARITY ASSESSMENT */}
          {activeTab === "clarity" && (
            <motion.div 
              key="clarity"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Giant visual meter */}
                <section className="bg-white/[0.01] border border-white/[0.06] rounded-3xl p-8 shadow-[0_8px_30px_rgba(0,0,0,0.12)] backdrop-blur-md col-span-1 flex flex-col items-center justify-center text-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/[0.03] to-transparent pointer-events-none"></div>
                  <h2 className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.15em] mb-6">Total Clarity Grade</h2>
                  
                  {/* Radial Progress */}
                  <div className="relative w-36 h-36 flex items-center justify-center mb-6 scale-105">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" className="stroke-white/[0.03] fill-none" strokeWidth="7" />
                      <circle 
                        cx="50" cy="50" r="42" 
                        className="stroke-emerald-500 fill-none transition-all duration-1000 ease-out"
                        strokeWidth="7"
                        strokeDasharray={`${2 * Math.PI * 42}`}
                        strokeDashoffset={`${2 * Math.PI * 42 * (1 - clarity.score / 100)}`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-black text-white leading-none tracking-tight">{clarity.score}</span>
                      <span className="text-slate-500 text-[9px] mt-1 uppercase font-bold tracking-[0.15em]">percent</span>
                    </div>
                  </div>

                  <div className="bg-emerald-500/5 border border-emerald-500/20 text-emerald-400 px-4 py-1.5 rounded-full font-bold text-xs tracking-wide flex items-center gap-1.5 shadow-sm">
                    <Award size={14} className="text-emerald-400 animate-pulse" />
                    Grade {clarity.grade}
                  </div>
                </section>

                {/* Stats Breakdown Cards */}
                <section className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Total Flag Stat */}
                  <div className="bg-white/[0.01] border border-white/[0.06] rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.12)] backdrop-blur-md flex flex-col justify-between relative group hover:border-white/[0.1] transition-colors">
                    <div>
                      <div className="p-2.5 bg-white/[0.03] border border-white/[0.06] rounded-2xl w-11 h-11 flex items-center justify-center text-orange-400 mb-4 group-hover:text-orange-300 group-hover:bg-white/[0.05] transition-all duration-300">
                        <AlertCircle size={20} />
                      </div>
                      <div className="text-3xl font-black mb-1 tracking-tight text-white">{clarity.stats.total_ambiguities}</div>
                      <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Ambiguities Tagged</div>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-5 leading-snug max-w-[90%]">
                      Identified segments lacking quantitative boundaries, strict definitions, or numeric parameters.
                    </p>
                  </div>

                  {/* Clarified Rate Stat */}
                  <div className="bg-white/[0.01] border border-white/[0.06] rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.12)] backdrop-blur-md flex flex-col justify-between relative group hover:border-white/[0.1] transition-colors">
                    <div>
                      <div className="p-2.5 bg-white/[0.03] border border-white/[0.06] rounded-2xl w-11 h-11 flex items-center justify-center text-indigo-400 mb-4 group-hover:text-indigo-300 group-hover:bg-white/[0.05] transition-all duration-300">
                        <CheckCircle2 size={20} />
                      </div>
                      <div className="text-3xl font-black mb-1 tracking-tight text-white">{clarity.stats.resolution_rate_pct}%</div>
                      <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Resolution Rate</div>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-5 leading-snug max-w-[90%]">
                      Percentage of live ambiguity flags successfully clarified and resolved before the session closed.
                    </p>
                  </div>

                  {/* Metric Density Stat */}
                  <div className="bg-white/[0.01] border border-white/[0.06] rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.12)] backdrop-blur-md flex flex-col justify-between col-span-1 sm:col-span-2 group hover:border-white/[0.1] transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="p-2.5 bg-white/[0.03] border border-white/[0.06] rounded-2xl w-11 h-11 flex items-center justify-center text-emerald-400 mb-4 group-hover:text-emerald-300 group-hover:bg-white/[0.05] transition-all duration-300">
                          <TrendingUp size={20} />
                        </div>
                        <div className="text-3xl font-black mb-1 tracking-tight text-white">{clarity.stats.metric_density_pct}%</div>
                        <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Precision Density</div>
                      </div>
                      <div className="w-32 h-1.5 bg-white/[0.04] rounded-full overflow-hidden mt-3 shadow-inner">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(clarity.stats.metric_density_pct * 10, 100)}%` }}
                          transition={{ duration: 1 }}
                          className="h-full bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" 
                        />
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-5 leading-relaxed">
                      Frequency of currency tokens ($), numeric figures, due-dates, and percentages relative to the total word output. 
                      Elite targets achieve &gt;2.5% density.
                    </p>
                  </div>
                </section>
              </div>

              {/* Evaluation Context Footer */}
              <div className="p-4 bg-white/[0.02] border border-white/[0.04] rounded-2xl text-[11px] text-slate-500 leading-relaxed font-mono tracking-wide">
                <strong className="text-slate-400 font-bold uppercase tracking-wider font-sans mr-1">Methodology Note:</strong> 
                This quantitative grade is mathematically tabulated by balancing total tags, verified resolution timelines, 
                and total numeric context depth, penalized negatively for outstanding ambiguity debt.
              </div>
            </motion.div>
          )}

          {/* TAB 4: CLIENT REPLICANT CHAT SANDBOX */}
          {activeTab === "replicant" && (
            <motion.div 
              key="replicant"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[60vh]"
            >
              
              {/* Left Side: The Client DNA Card */}
              <aside className="bg-white/[0.01] border border-white/[0.06] rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.12)] backdrop-blur-md lg:col-span-1 flex flex-col h-fit relative group hover:border-white/[0.09] transition-colors">
                <div className="flex items-center gap-3 pb-4 border-b border-white/[0.04] mb-6">
                  <div className="w-10 h-10 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shadow-sm shrink-0">
                    <Brain size={20} />
                  </div>
                  <div>
                    <h2 className="font-bold text-white tracking-tight text-sm">Client Persona DNA</h2>
                    <p className="text-[10px] text-slate-500 font-bold tracking-wide uppercase">Synthesis Module Active</p>
                  </div>
                </div>

                <div className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-4 mb-6 shadow-inner">
                  <h3 className="font-black text-lg bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent mb-0.5 leading-tight">
                    {report.persona?.name || "Client"}
                  </h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1.5">
                    <UserRound size={12} className="text-slate-500 shrink-0" /> 
                    <span className="truncate font-medium">{report.persona?.role_title || "Customer"} @ {report.persona?.company || "The Project"}</span>
                  </p>
                  <div className="flex gap-2 mt-3 flex-wrap">
                    <span className="text-[10px] font-bold bg-white/[0.04] border border-white/[0.06] text-slate-300 rounded-md px-2.5 py-0.5 flex items-center gap-1 tracking-wide">
                      🗣️ {report.persona?.communication_style || "Balanced"}
                    </span>
                    <span className="text-[10px] font-bold bg-white/[0.04] border border-white/[0.06] text-slate-300 rounded-md px-2.5 py-0.5 tracking-wide">
                      🧠 {report.persona?.domain_knowledge || "Medium"} Tech
                    </span>
                  </div>
                </div>

                <div className="space-y-5 text-sm">
                  <div>
                    <h4 className="text-[10px] text-slate-500 uppercase tracking-[0.15em] font-bold mb-3">Core Priorities</h4>
                    <div className="space-y-1.5">
                      {report.persona?.key_priorities?.map((p, i) => (
                        <div key={i} className="text-slate-300 flex items-start gap-2 text-xs leading-normal">
                          <div className="w-1.5 h-1.5 rounded-full bg-purple-500/60 mt-1.5 shrink-0 animate-pulse"></div>
                          <span className="font-medium">{p}</span>
                        </div>
                      ))}
                      {(!report.persona?.key_priorities || report.persona.key_priorities.length === 0) && <p className="text-xs text-slate-500 italic">None detected.</p>}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[10px] text-slate-500 uppercase tracking-[0.15em] font-bold mb-3">Preferences & Demands</h4>
                    <div className="space-y-1.5">
                      {report.persona?.stated_preferences?.map((pref, i) => (
                        <div key={i} className="text-xs text-emerald-400/90 bg-emerald-500/[0.02] border border-emerald-500/10 rounded-xl px-3 py-2.5 leading-relaxed font-medium">
                          ✓ {pref}
                        </div>
                      ))}
                      {(!report.persona?.stated_preferences || report.persona.stated_preferences.length === 0) && <p className="text-xs text-slate-500 italic">None explicitly stated.</p>}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[10px] text-slate-500 uppercase tracking-[0.15em] font-bold mb-3">Underlying Worries</h4>
                    <div className="space-y-1.5">
                      {report.persona?.core_worries?.map((w, i) => (
                        <div key={i} className="text-xs text-orange-400/90 bg-orange-500/[0.02] border border-orange-500/10 rounded-xl px-3 py-2.5 leading-relaxed flex gap-1.5 font-medium">
                          <ShieldAlert size={12} className="shrink-0 mt-0.5 text-orange-400" />
                          <span>{w}</span>
                        </div>
                      ))}
                      {(!report.persona?.core_worries || report.persona.core_worries.length === 0) && <p className="text-xs text-slate-500 italic">None explicitly raised.</p>}
                    </div>
                  </div>
                </div>
              </aside>

              {/* Right Side: The Replicant Interactive Chat Console */}
              <section className="bg-white/[0.01] border border-white/[0.06] rounded-3xl flex flex-col lg:col-span-2 shadow-[0_8px_30px_rgba(0,0,0,0.12)] backdrop-blur-md relative overflow-hidden h-[70vh] group hover:border-white/[0.09] transition-colors">
                {/* Terminal Header */}
                <div className="bg-black/20 border-b border-white/[0.04] p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative flex">
                      <div className="w-2.5 h-2.5 rounded-full bg-purple-500 relative z-10"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-purple-500 absolute top-0 animate-ping opacity-75 z-0"></div>
                    </div>
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-white">Active Simulated Session</span>
                      <span className="text-[9px] tracking-widest text-slate-500 font-bold uppercase block leading-none mt-1 font-mono">Psychology Matrix Loaded</span>
                    </div>
                  </div>
                  <div className="px-2 py-0.5 border border-white/10 rounded-md bg-white/[0.02] text-[9px] text-slate-400 font-mono font-semibold tracking-wide">
                    gemini-2.5-flash
                  </div>
                </div>

                {/* Messages Scrolling Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-gradient-to-b from-black/5 to-black/10">
                  {chatHistory.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.08)] text-[13px] sm:text-sm leading-relaxed flex items-start gap-3 ${
                        msg.role === 'user' 
                          ? 'bg-indigo-600 text-white border border-indigo-500/20 rounded-br-sm font-medium'
                          : 'bg-white/[0.02] border border-white/[0.05] text-slate-200 rounded-bl-sm'
                      }`}>
                        {msg.role === 'bot' && (
                          <div className="w-6 h-6 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0 mt-0.5">
                            <Brain size={13} />
                          </div>
                        )}
                        <div>
                          {msg.text}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Typing Loader */}
                  {isTyping && (
                    <div className="flex justify-start animate-pulse">
                      <div className="bg-white/[0.02] border border-white/[0.05] text-slate-400 rounded-2xl rounded-bl-sm p-4 flex items-center gap-3 text-xs shadow-sm">
                        <div className="w-5 h-5 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-300 animate-spin shrink-0">
                          <Sparkles size={12} />
                        </div>
                        Simulating behavioral response...
                      </div>
                    </div>
                  )}
                </div>

                {/* Fixed Input Bar Footer */}
                <div className="p-4 bg-black/10 border-t border-white/[0.04]">
                  <form 
                    onSubmit={(e) => { e.preventDefault(); handleSendChat(); }}
                    className="flex gap-2 items-center bg-white/[0.02] border border-white/[0.06] rounded-xl p-1.5 focus-within:border-purple-500/30 focus-within:bg-white/[0.03] transition-all shadow-inner"
                  >
                    <input 
                      type="text"
                      value={inputMsg}
                      onChange={(e) => setInputMsg(e.target.value)}
                      placeholder={`Pitch an idea or ask ${report.persona?.name || 'them'} a question...`}
                      disabled={isTyping}
                      className="flex-1 bg-transparent outline-none text-sm text-white px-3 py-1 placeholder-slate-500 disabled:opacity-50 font-medium"
                    />
                    <button
                      type="submit"
                      disabled={isTyping || !inputMsg.trim()}
                      className="bg-purple-600 hover:bg-purple-500 disabled:bg-white/[0.03] text-white disabled:text-slate-600 rounded-lg p-2.5 transition-all active:scale-95 flex items-center justify-center shrink-0 shadow-sm"
                    >
                      <Send size={14} />
                    </button>
                  </form>
                  <div className="text-center text-[9px] text-slate-600 mt-3 tracking-[0.15em] font-bold uppercase font-mono">
                    ⚠ Simulated client replica. Context extracted from transcript constraints.
                  </div>
                </div>
              </section>
            </motion.div>
          )}

          {activeTab === "transcript" && (
            <motion.div
              key="transcript"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 h-[70vh] lg:h-[75vh] mb-12 pb-12"
            >
              {/* Left side: Raw Transcript Bubbles */}
              <section className="lg:col-span-2 bg-surface border border-white/5 rounded-3xl flex flex-col h-full relative overflow-hidden shadow-2xl">
                <div className="p-5 border-b border-white/[0.04] flex items-center justify-between bg-gradient-to-r from-white/[0.01] to-transparent">
                  <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-sky-400 flex items-center gap-2">
                    <MessageSquareText size={14} /> Full Meeting Logs
                  </h2>
                  <span className="text-[9px] font-mono bg-sky-500/10 border border-sky-500/20 text-sky-300 px-2 py-0.5 rounded-full uppercase font-bold">
                    {transcript?.length || 0} Entries Recorded
                  </span>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                  {(!transcript || transcript.length === 0) ? (
                    <div className="h-64 flex flex-col items-center justify-center text-center opacity-50">
                      <MessageSquareText size={32} className="mb-3 text-slate-600" />
                      <p className="text-sm font-medium text-slate-500">No live transcript chunks recorded.</p>
                    </div>
                  ) : (
                    transcript.map((t, i) => (
                      <div key={i} className="flex flex-col space-y-1">
                        <div className="flex items-center gap-2 text-[10px] font-bold tracking-wide uppercase text-slate-500 font-mono">
                          <span className="text-slate-300">{t.speaker || 'Unknown Speaker'}</span>
                        </div>
                        <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-3 text-sm text-slate-300 leading-relaxed shadow-sm">
                          {t.text}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>

              {/* Right Side: Detailed Flags Archive */}
              <section className="lg:col-span-1 flex flex-col h-full space-y-6">
                
                {/* 1. Active Ambiguity Flags */}
                <div className="flex-1 bg-surface border border-white/5 rounded-3xl p-5 flex flex-col overflow-hidden relative shadow-lg">
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/[0.04]">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-orange-400 flex items-center gap-1.5">
                      <ShieldAlert size={13} /> Active Flags
                    </h3>
                    <span className="text-[10px] font-mono bg-orange-500/10 text-orange-300 px-2 rounded font-bold border border-orange-500/10">
                      {ambiguities?.length || 0}
                    </span>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
                    {(!ambiguities || ambiguities.length === 0) ? (
                      <p className="text-xs text-slate-500 text-center py-8 italic">No active flags pending.</p>
                    ) : (
                      ambiguities.map((a, i) => (
                        <div key={i} className="p-3 bg-white/[0.01] border border-white/[0.04] rounded-xl flex flex-col space-y-2">
                          <div className="text-[9px] font-black uppercase text-orange-400 font-mono tracking-wider opacity-80 bg-orange-500/5 border border-orange-500/10 w-max px-1.5 rounded">
                            {a.type || 'vague'}
                          </div>
                          <p className="text-xs font-serif italic text-slate-300">"{a.quote}"</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* 2. Resolved/Cleared Ambiguities */}
                <div className="flex-1 bg-surface border border-white/5 rounded-3xl p-5 flex flex-col overflow-hidden relative shadow-lg">
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/[0.04]">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 size={13} /> Cleared Metrics
                    </h3>
                    <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-300 px-2 rounded font-bold border border-emerald-500/10">
                      {resolved?.length || 0}
                    </span>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
                    {(!resolved || resolved.length === 0) ? (
                      <p className="text-xs text-slate-500 text-center py-8 italic">No metrics cleared during call.</p>
                    ) : (
                      resolved.map((r, i) => (
                        <div key={i} className="p-3 bg-white/[0.01] border border-emerald-500/10 rounded-xl flex flex-col space-y-2 bg-gradient-to-br from-emerald-500/[0.01] to-transparent">
                          <div className="text-[9px] font-black uppercase text-emerald-400 font-mono tracking-wider bg-emerald-500/5 w-max px-1.5 rounded">
                            Resolved
                          </div>
                          <p className="text-xs font-serif italic text-slate-300 line-through decoration-emerald-500/30">"{r.quote}"</p>
                          {r.suggestion && (
                            <p className="text-[10px] text-slate-500 bg-black/10 p-1.5 rounded font-medium border border-white/5">
                              💡 {r.suggestion}
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </section>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </motion.div>
  );
}

// Missing Icon Import Helper
function AlertCircle({ size }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" width={size} height={size} 
      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" 
      strokeLinecap="round" strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="8" x2="12" y2="12"></line>
      <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
  );
}
