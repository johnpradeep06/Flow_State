import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, doc, getDoc, getDocs, addDoc, serverTimestamp, query, orderBy } from "firebase/firestore";
import { useSessionStore } from "../store/sessionStore";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Play, Calendar, Award, Clock, ShieldAlert, ArrowRight, UserRound, History, BrainCircuit } from "lucide-react";

export default function MeetingPortal() {
  const { companyId, projectId } = useParams();
  const { user, setNavContext, setActiveMeeting } = useSessionStore();
  const navigate = useNavigate();

  const [company, setCompany] = useState(null);
  const [project, setProject] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    // Set global nav context so our session listener knows where we are
    setNavContext(companyId, projectId);
    fetchContext();
  }, [companyId, projectId, user]);

  const fetchContext = async () => {
    try {
      setLoading(true);
      // 1. Fetch Company
      const compRef = doc(db, "companies", companyId);
      const compSnap = await getDoc(compRef);
      if (compSnap.exists()) setCompany(compSnap.data());

      // 2. Fetch Project
      const projRef = doc(db, "companies", companyId, "projects", projectId);
      const projSnap = await getDoc(projRef);
      if (projSnap.exists()) setProject(projSnap.data());

      // 3. Fetch historical meetings
      const q = query(
        collection(db, "companies", companyId, "projects", projectId, "meetings"),
        orderBy("date", "desc")
      );
      const meetSnap = await getDocs(q);
      const list = meetSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setMeetings(list);
    } catch (err) {
      console.error("Fetch meeting portal failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartNewMeeting = async () => {
    setStarting(true);
    try {
      // Calculate sequence: e.g. Meet 1, Meet 2, etc.
      const nextCount = meetings.length + 1;
      const nextTitle = `Meet ${nextCount}`;

      // Push initial runner document to Firestore
      const meetRef = await addDoc(
        collection(db, "companies", companyId, "projects", projectId, "meetings"), 
        {
          title: nextTitle,
          date: serverTimestamp(),
          status: "running",
          transcript: [],
          ambiguities: [],
          resolved: [],
          chatHistory: [],
          report: null
        }
      );

      // Lock this globally into Zustand so components know the dynamic cloud path
      setActiveMeeting(meetRef.id, nextTitle);

      // Purge any legacy Zustand session leftovers before booting the websocket
      useSessionStore.setState({
        transcript: [],
        ambiguities: [],
        resolved: [],
        report: null,
        agentStates: {}
      });

      // Navigate to Live Dashboard page
      navigate(`/c/${companyId}/p/${projectId}/live`);
    } catch (err) {
      console.error("Failed to provision live meeting instance:", err);
    } finally {
      setStarting(false);
    }
  };

  const handleViewPastMeeting = (meet) => {
    // Pre-populate Zustand with the serialized historical snapshot
    setActiveMeeting(meet.id, meet.title);
    useSessionStore.setState({
      transcript: meet.transcript || [],
      ambiguities: meet.ambiguities || [],
      resolved: meet.resolved || [],
      report: meet.report || null,
      agentStates: {}
    });
    // Forward to historical analytical visualizer
    navigate(`/c/${companyId}/p/${projectId}/report/${meet.id}`);
  };

  return (
    <div className="min-h-screen bg-[#030014] font-sans text-white relative selection:bg-indigo-500/30 p-6 md:p-10">
      <div className="ambient-mesh pointer-events-none opacity-20" />

      <div className="max-w-7xl mx-auto flex flex-col min-h-[90vh] relative z-10">
        
        {/* Navigation Top Bar */}
        <header className="mb-12 flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-white/[0.06]">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/c/${companyId}`)}
              className="p-2.5 bg-white/[0.02] border border-white/[0.06] rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.05] transition-all shrink-0 cursor-pointer group"
            >
              <ChevronLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
            </button>
            <div>
              <div className="flex items-center gap-2 flex-wrap text-[10px] font-bold tracking-widest uppercase text-slate-500">
                <span className="text-indigo-400">{company?.name}</span>
                <span className="text-slate-700 font-mono">/</span>
                <span>{project?.name}</span>
              </div>
              <h1 className="text-2xl font-black tracking-tight mt-1.5 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                Session Registry
              </h1>
            </div>
          </div>

          {/* Instant Execution Core CTA */}
          <button
            onClick={handleStartNewMeeting}
            disabled={starting}
            className="flex items-center gap-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white border border-indigo-500/30 rounded-2xl px-6 py-3.5 cursor-pointer font-extrabold text-sm tracking-wider shadow-[0_4px_25px_rgba(99,102,241,0.3)] active:scale-95 transition-all disabled:opacity-50 shrink-0 uppercase"
          >
            {starting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Spinning Up Agent Swarm...
              </>
            ) : (
              <>
                <Play size={15} fill="white" className="shrink-0" />
                Start Live Agent Swarm
              </>
            )}
          </button>
        </header>

        <main className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left Stats/Description Card */}
          <section className="bg-white/[0.01] border border-white/[0.06] rounded-3xl p-6 lg:col-span-1 backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.1)]">
            <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-indigo-400 mb-4 flex items-center gap-2">
              <BrainCircuit size={14} /> Environment Context
            </h2>
            <h3 className="text-lg font-extrabold mb-2">{project?.name}</h3>
            <p className="text-slate-400 text-xs leading-relaxed mb-6">
              {project?.description || "No functional summary provided."}
            </p>
            <div className="pt-6 border-t border-white/[0.04] space-y-4 font-mono text-[10px] text-slate-500">
              <div className="flex justify-between">
                <span className="uppercase font-bold tracking-wider">Total Audited Meets</span>
                <span className="text-slate-200 font-bold">{meetings.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="uppercase font-bold tracking-wider">Last Session Run</span>
                <span className="text-slate-200 font-bold">
                  {meetings.length > 0 && meetings[0].date?.toDate 
                    ? new Date(meetings[0].date.toDate()).toLocaleDateString()
                    : 'None'}
                </span>
              </div>
            </div>
          </section>

          {/* Right Historical Timeline List */}
          <section className="lg:col-span-2">
            <div className="mb-6 flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest pl-2">
              <History size={14} className="text-slate-500" /> Session History Stream
            </div>

            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 bg-white/[0.01] border border-white/[0.06] rounded-3xl backdrop-blur-sm">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-[10px] font-mono text-slate-500 tracking-[0.15em] uppercase animate-pulse">Reconstructing Logs...</span>
              </div>
            ) : meetings.length === 0 ? (
              <div className="py-24 text-center bg-white/[0.01] border border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center px-6">
                <div className="w-12 h-12 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-center text-slate-600 mb-4">
                  <History size={20} />
                </div>
                <p className="text-xs text-slate-500">No historical sessions recorded under this project node.</p>
                <p className="text-[10px] text-slate-600 mt-1 uppercase tracking-wider font-bold">Trigger "Start Live Agent Swarm" above to initialize tracking.</p>
              </div>
            ) : (
              <motion.div layout className="space-y-4">
                {meetings.map((m, i) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.3 }}
                    whileHover={{ scale: 1.005, borderColor: "rgba(255,255,255,0.1)" }}
                    onClick={() => handleViewPastMeeting(m)}
                    className="bg-white/[0.01] border border-white/[0.06] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 backdrop-blur-md cursor-pointer relative overflow-hidden hover:shadow-lg transition-all group"
                  >
                    {/* Internal Left Details */}
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-center text-slate-400 group-hover:text-indigo-400 group-hover:border-indigo-500/20 group-hover:bg-indigo-500/5 transition-all shrink-0 shadow-inner">
                        <UserRound size={16} />
                      </div>
                      <div>
                        <h3 className="font-black text-[15px] text-white group-hover:text-indigo-300 transition-colors tracking-tight">
                          {m.title}
                        </h3>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-mono font-semibold text-slate-500 mt-1.5 uppercase tracking-wide">
                          <span className="flex items-center gap-1"><Calendar size={10} /> {m.date?.toDate ? new Date(m.date.toDate()).toLocaleDateString() : 'Just now'}</span>
                          <span className="flex items-center gap-1"><Clock size={10} /> {m.date?.toDate ? new Date(m.date.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                        </div>
                      </div>
                    </div>

                    {/* Stats badges */}
                    <div className="flex items-center justify-between sm:justify-end gap-6 pt-3 sm:pt-0 border-t sm:border-t-0 border-white/[0.04]">
                      {m.report?.clarity?.grade ? (
                        <div className="flex gap-2">
                          <span className="bg-emerald-500/5 border border-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-lg font-bold text-[10px] tracking-wider flex items-center gap-1 font-mono uppercase select-none shadow-sm">
                            <Award size={11} /> Grade {m.report.clarity.grade}
                          </span>
                          <span className="bg-white/[0.02] border border-white/[0.06] text-slate-400 px-2.5 py-1 rounded-lg font-bold text-[10px] tracking-wider flex items-center font-mono select-none shadow-sm">
                            {m.report.clarity.score}% Clarity
                          </span>
                        </div>
                      ) : m.status === "running" ? (
                        <span className="bg-indigo-500/5 border border-indigo-500/20 text-indigo-400 px-2.5 py-1 rounded-lg font-bold text-[10px] tracking-widest uppercase flex items-center gap-1.5 font-mono select-none shadow-sm animate-pulse">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping shrink-0" />
                          Running
                        </span>
                      ) : (
                        <span className="bg-orange-500/5 border border-orange-500/20 text-orange-400 px-2.5 py-1 rounded-lg font-bold text-[10px] tracking-widest uppercase flex items-center gap-1 font-mono select-none shadow-sm">
                          <ShieldAlert size={11} /> Open Session
                        </span>
                      )}

                      {/* Navigation Arrow */}
                      <div className="w-7 h-7 rounded-lg border border-white/[0.06] bg-white/[0.01] group-hover:bg-indigo-500 flex items-center justify-center group-hover:text-white text-slate-500 group-hover:border-indigo-500/20 transition-all shadow-sm shrink-0">
                        <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
