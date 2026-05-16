import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, doc, getDoc, getDocs, addDoc, serverTimestamp, query, orderBy } from "firebase/firestore";
import { useSessionStore } from "../store/sessionStore";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Plus, Layers, Calendar, ArrowRight, FileText, Sparkles, Database } from "lucide-react";

export default function ProjectPortal() {
  const { companyId } = useParams();
  const { user } = useSessionStore();
  const navigate = useNavigate();

  const [company, setCompany] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [projName, setProjName] = useState("");
  const [projDesc, setProjDesc] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchDetails();
  }, [companyId, user]);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      // 1. Fetch Company Name
      const compRef = doc(db, "companies", companyId);
      const compSnap = await getDoc(compRef);
      if (compSnap.exists()) {
        setCompany(compSnap.data());
      } else {
        navigate("/"); // Redirect back if not found
        return;
      }

      // 2. Fetch Projects subcollection
      const q = query(
        collection(db, "companies", companyId, "projects"),
        orderBy("createdAt", "desc")
      );
      const projSnap = await getDocs(q);
      const list = projSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setProjects(list);
    } catch (err) {
      console.error("Fetch project details failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!projName.trim()) return;
    setCreating(true);
    try {
      await addDoc(collection(db, "companies", companyId, "projects"), {
        name: projName,
        description: projDesc,
        createdAt: serverTimestamp()
      });
      setProjName("");
      setProjDesc("");
      setShowModal(false);
      await fetchDetails();
    } catch (err) {
      console.error("Create project error:", err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030014] font-sans text-white relative selection:bg-indigo-500/30 p-6 md:p-10">
      <div className="ambient-mesh pointer-events-none opacity-20" />

      <div className="max-w-7xl mx-auto flex flex-col min-h-[90vh] relative z-10">
        
        {/* Breadcrumbs and Navigation Header */}
        <header className="mb-12 flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-white/[0.06]">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/")}
              className="p-2.5 bg-white/[0.02] border border-white/[0.06] rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.05] transition-all shrink-0 cursor-pointer group"
              title="Back to Organizations"
            >
              <ChevronLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
            </button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold tracking-widest uppercase text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded">
                  ORGANIZATION
                </span>
                <span className="text-slate-600 text-xs">/</span>
                <span className="text-slate-400 text-sm font-bold tracking-tight">{company?.name || "Loading..."}</span>
              </div>
              <h1 className="text-2xl font-black tracking-tight text-white mt-1.5">
                Software Deliverables
              </h1>
            </div>
          </div>

          {/* Project Quick Stats */}
          <div className="flex items-center gap-4 text-xs bg-white/[0.01] border border-white/[0.04] px-4 py-2 rounded-2xl font-mono text-slate-500">
            <div className="flex items-center gap-1.5">
              <Layers size={13} className="text-indigo-400" />
              <span>{projects.length} active systems</span>
            </div>
          </div>
        </header>

        {/* Main Body Listing */}
        <main className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Active Projects</h2>
              <p className="text-xs text-slate-500">Configure individual scopes to trigger ambiguity swarm loops.</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-500/30 rounded-xl px-4 py-2 cursor-pointer text-xs font-bold tracking-wide shadow-[0_4px_20px_rgba(99,102,241,0.25)] active:scale-95 transition-all"
            >
              <Plus size={15} /> Create Project
            </button>
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4">
              <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-slate-500 font-mono tracking-widest animate-pulse">LOADING PROJECT SCHEMA...</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="py-24 text-center bg-white/[0.01] border border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center px-6 backdrop-blur-sm">
              <div className="w-14 h-14 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-center text-slate-500 mb-5">
                <Database size={24} />
              </div>
              <h3 className="text-base font-bold text-white tracking-tight mb-1">No Projects Initialized</h3>
              <p className="text-xs text-slate-500 max-w-[300px] leading-relaxed mb-6">
                Add a technical project module to begin indexing meetings, generating specs, and monitoring clarity scores.
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="text-xs font-bold text-indigo-400 flex items-center gap-1.5 bg-indigo-500/5 border border-indigo-500/10 hover:bg-indigo-500/10 rounded-xl px-4 py-2 transition-all cursor-pointer"
              >
                <Plus size={14} /> Provision Project Repo
              </button>
            </div>
          ) : (
            <motion.div 
              layout
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              {projects.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.4 }}
                  whileHover={{ y: -3, borderColor: "rgba(255,255,255,0.1)" }}
                  onClick={() => navigate(`/c/${companyId}/p/${p.id}`)}
                  className="bg-white/[0.01] border border-white/[0.06] rounded-3xl p-6 backdrop-blur-md cursor-pointer flex gap-5 relative group overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.1)]"
                >
                  <div className="absolute top-0 left-0 w-[2px] h-0 bg-gradient-to-b from-indigo-500 to-purple-500 group-hover:h-full transition-all duration-500" />
                  
                  <div className="w-12 h-12 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-center text-slate-400 group-hover:text-indigo-400 group-hover:bg-indigo-500/5 group-hover:border-indigo-500/20 transition-all shrink-0 shadow-inner">
                    <FileText size={20} />
                  </div>

                  <div className="flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors tracking-tight truncate max-w-[200px] sm:max-w-[350px]">
                        {p.name}
                      </h3>
                      <span className="text-[9px] text-slate-500 font-mono font-bold uppercase flex items-center gap-1 select-none shrink-0">
                        <Calendar size={10} />
                        {p.createdAt?.toDate ? new Date(p.createdAt.toDate()).toLocaleDateString() : 'Just now'}
                      </span>
                    </div>

                    <p className="text-slate-400 text-xs leading-relaxed line-clamp-2 pr-4 mb-4">
                      {p.description || "No functional description defined for this deliverable matrix."}
                    </p>

                    <div className="mt-auto pt-4 border-t border-white/[0.04] flex items-center justify-between text-[9px] font-mono uppercase tracking-[0.15em] font-bold text-slate-500 group-hover:text-slate-400 transition-colors">
                      <span>View Analytics Matrix</span>
                      <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform text-indigo-400" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </main>

        <footer className="mt-20 py-6 border-t border-white/[0.03] text-center">
          <p className="text-[9px] tracking-[0.2em] font-bold uppercase text-slate-700 font-mono">Secured Matrix Endpoint</p>
        </footer>
      </div>

      {/* Creation Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !creating && setShowModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-[#070518] border border-white/[0.08] rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
            >
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
              
              <h3 className="text-lg font-bold tracking-tight mb-1 flex items-center gap-2">
                <Layers size={18} className="text-indigo-400" /> Create Project Node
              </h3>
              <p className="text-xs text-slate-400 font-medium mb-6">Define a specific scoped deliverable repository.</p>

              <form onSubmit={handleCreateProject} className="space-y-4">
                <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-bold tracking-[0.15em] mb-2">Project Title</label>
                  <input 
                    type="text"
                    required
                    value={projName}
                    onChange={(e) => setProjName(e.target.value)}
                    placeholder="e.g. Mobile App Redesign v2"
                    disabled={creating}
                    className="w-full bg-white/[0.02] border border-white/[0.06] focus:border-indigo-500/30 focus:bg-white/[0.03] transition-all outline-none rounded-xl px-4 py-2.5 text-sm placeholder-slate-600"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-bold tracking-[0.15em] mb-2">Deliverable Scope</label>
                  <textarea 
                    value={projDesc}
                    onChange={(e) => setProjDesc(e.target.value)}
                    placeholder="Describe the tech stack, primary objectives, or architectural goals..."
                    disabled={creating}
                    rows={3}
                    className="w-full bg-white/[0.02] border border-white/[0.06] focus:border-indigo-500/30 focus:bg-white/[0.03] transition-all outline-none rounded-xl px-4 py-2.5 text-sm placeholder-slate-600 resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    disabled={creating}
                    onClick={() => setShowModal(false)}
                    className="flex-1 border border-white/[0.06] hover:border-white/15 text-slate-300 py-2.5 rounded-xl text-xs font-bold tracking-wide hover:bg-white/[0.01] cursor-pointer transition-all disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-700 text-white py-2.5 rounded-xl text-xs font-bold tracking-wide shadow-md cursor-pointer transition-all flex items-center justify-center gap-2"
                  >
                    {creating ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Provisioning...
                      </>
                    ) : "Create Project"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
