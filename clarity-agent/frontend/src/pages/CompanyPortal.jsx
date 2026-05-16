import { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { collection, query, where, getDocs, addDoc, serverTimestamp, orderBy } from "firebase/firestore";
import { useSessionStore } from "../store/sessionStore";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Plus, ArrowRight, LogOut, User, Calendar, Sparkles, Briefcase } from "lucide-react";

export default function CompanyPortal() {
  const { user, setUser } = useSessionStore();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  const [compName, setCompName] = useState("");
  const [compDesc, setCompDesc] = useState("");
  const [creating, setCreating] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchCompanies();
  }, [user]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, "companies"), 
        where("ownerUid", "==", user.uid)
      );
      const snap = await getDocs(q);
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Client-side sort to avoid requiring complex composite Firestore indexing
      list.sort((a, b) => {
        const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return bTime - aTime;
      });

      setCompanies(list);
    } catch (err) {
      console.error("Fetch companies error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCompany = async (e) => {
    e.preventDefault();
    if (!compName.trim()) return;
    setCreating(true);
    try {
      await addDoc(collection(db, "companies"), {
        name: compName,
        description: compDesc,
        ownerUid: user.uid,
        createdAt: serverTimestamp()
      });
      setCompName("");
      setCompDesc("");
      setShowModal(false);
      await fetchCompanies();
    } catch (err) {
      console.error("Create company error:", err);
    } finally {
      setCreating(false);
    }
  };

  const handleLogout = () => {
    auth.signOut();
    setUser(null);
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#030014] font-sans text-white relative selection:bg-indigo-500/30 p-6 md:p-10 overflow-x-hidden">
      <div className="ambient-mesh pointer-events-none opacity-30" />
      
      <div className="max-w-7xl mx-auto flex flex-col min-h-[90vh]">
        {/* Global Top Header */}
        <header className="mb-12 flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-white/[0.06] z-10">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shrink-0">
              <Sparkles size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent leading-tight">
                Agent Flow Workspaces
              </h1>
              <p className="text-[10px] tracking-[0.15em] uppercase text-slate-500 font-bold mt-1">
                Root Environment Matrix
              </p>
            </div>
          </div>

          {/* Profile / Logout */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.02] border border-white/[0.06] select-none">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="avatar" className="w-6 h-6 rounded-full object-cover border border-indigo-500/30 shrink-0" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-300 shrink-0"><User size={12}/></div>
              )}
              <span className="text-xs font-medium text-slate-300 max-w-[120px] truncate">{user?.displayName || user?.email}</span>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 rounded-xl bg-white/[0.02] hover:bg-red-500/10 hover:border-red-500/30 border border-white/[0.06] text-slate-400 hover:text-red-400 transition-all shrink-0 cursor-pointer"
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {/* Main Dashboard Layout */}
        <main className="flex-1 z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Organizations</h2>
              <p className="text-xs text-slate-500">Manage your active client environments and portfolios.</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-500/30 rounded-xl px-4 py-2 cursor-pointer text-xs font-bold tracking-wide shadow-[0_4px_20px_rgba(99,102,241,0.25)] active:scale-95 transition-all"
            >
              <Plus size={15} /> New Organization
            </button>
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4">
              <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-slate-500 font-mono tracking-widest animate-pulse">FETCHING TENANT NODES...</p>
            </div>
          ) : companies.length === 0 ? (
            <div className="py-24 text-center bg-white/[0.01] border border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center px-6 backdrop-blur-sm">
              <div className="w-14 h-14 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-center text-slate-500 mb-5">
                <Building2 size={24} />
              </div>
              <h3 className="text-base font-bold text-white tracking-tight mb-1">No Organizations Found</h3>
              <p className="text-xs text-slate-500 max-w-[300px] leading-relaxed mb-6">
                Create your first client organization to begin auditing project meetings and capturing psychological profiles.
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="text-xs font-bold text-indigo-400 flex items-center gap-1.5 bg-indigo-500/5 border border-indigo-500/10 hover:bg-indigo-500/10 rounded-xl px-4 py-2 transition-all cursor-pointer"
              >
                <Plus size={14} /> Initialize Workspace
              </button>
            </div>
          ) : (
            <motion.div 
              layout
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {companies.map((c, i) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.4 }}
                  whileHover={{ y: -4, borderColor: "rgba(255,255,255,0.12)" }}
                  onClick={() => navigate(`/c/${c.id}`)}
                  className="bg-white/[0.01] border border-white/[0.06] rounded-3xl p-6 backdrop-blur-md cursor-pointer transition-all flex flex-col h-64 relative group overflow-hidden shadow-[0_4px_25px_rgba(0,0,0,0.12)]"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  
                  <div className="mb-4 flex justify-between items-start">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/5 border border-indigo-500/10 group-hover:border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:text-indigo-300 transition-colors shadow-sm">
                      <Briefcase size={18} />
                    </div>
                    <div className="text-[9px] text-slate-500 flex items-center gap-1.5 font-bold uppercase font-mono tracking-wider">
                      <Calendar size={11} />
                      {c.createdAt?.toDate ? new Date(c.createdAt.toDate()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Just now'}
                    </div>
                  </div>

                  <h3 className="text-lg font-extrabold tracking-tight text-white mb-2 group-hover:text-indigo-300 transition-colors truncate">
                    {c.name}
                  </h3>
                  
                  <p className="text-slate-400 text-xs leading-relaxed flex-1 line-clamp-3 pr-2">
                    {c.description || "No description specified for this organization entity."}
                  </p>

                  <div className="pt-4 border-t border-white/[0.04] flex items-center justify-between mt-auto group-hover:border-white/[0.08] transition-all">
                    <span className="text-[9px] font-bold font-mono text-slate-500 tracking-[0.15em] uppercase">Enter Workspace</span>
                    <div className="w-7 h-7 rounded-lg bg-white/[0.02] group-hover:bg-indigo-500 flex items-center justify-center text-slate-400 group-hover:text-white border border-white/[0.06] group-hover:border-indigo-500/30 transition-all">
                      <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </main>

        <footer className="mt-20 py-6 border-t border-white/[0.03] text-center z-10">
          <p className="text-[9px] tracking-[0.2em] font-bold uppercase text-slate-700 font-mono">Agent Flow Central Intelligence Persistence Protocol</p>
        </footer>
      </div>

      {/* Modal Overlay */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !creating && setShowModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            
            {/* Dialog Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-[#070518] border border-white/[0.08] rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
            >
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
              
              <h3 className="text-lg font-bold tracking-tight mb-1 flex items-center gap-2">
                <Building2 size={18} className="text-indigo-400" /> Create Organization
              </h3>
              <p className="text-xs text-slate-400 font-medium mb-6">Provision a isolated tenant workspace.</p>

              <form onSubmit={handleCreateCompany} className="space-y-4">
                <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-bold tracking-[0.15em] mb-2">Company Name</label>
                  <input 
                    type="text"
                    required
                    value={compName}
                    onChange={(e) => setCompName(e.target.value)}
                    placeholder="e.g. Acme Corporation"
                    disabled={creating}
                    className="w-full bg-white/[0.02] border border-white/[0.06] focus:border-indigo-500/30 focus:bg-white/[0.03] transition-all outline-none rounded-xl px-4 py-2.5 text-sm placeholder-slate-600"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-bold tracking-[0.15em] mb-2">Description</label>
                  <textarea 
                    value={compDesc}
                    onChange={(e) => setCompDesc(e.target.value)}
                    placeholder="Brief overview of corporate domain or client constraints..."
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
                    ) : "Create"}
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
