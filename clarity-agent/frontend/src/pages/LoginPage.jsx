import { useState, useEffect } from "react";
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "../firebase";
import { useSessionStore } from "../store/sessionStore";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Activity, Shield, Globe, Sparkles } from "lucide-react";

export default function LoginPage() {
  const { user, setUser } = useSessionStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/"); // Forward if already authed
    }
  }, [user, navigate]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await signInWithPopup(auth, provider);
      const u = result.user;
      setUser({
        uid: u.uid,
        email: u.email,
        displayName: u.displayName,
        photoURL: u.photoURL
      });
      navigate("/");
    } catch (err) {
      console.error("Google Login Error:", err);
      setError("Authentication failed. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#030014] overflow-hidden flex flex-col items-center justify-center font-sans selection:bg-indigo-500/30 text-white p-6">
      
      {/* Deep Celestial Ambient Background */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-900/15 rounded-full blur-[120px] pointer-events-none"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-md relative z-10 flex flex-col items-center"
      >
        
        {/* Floating Pulsing Logo Shield */}
        <div className="relative mb-8 flex items-center justify-center">
          <div className="absolute -inset-4 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 rounded-3xl blur-2xl opacity-20 animate-pulse" />
          <div className="relative w-16 h-16 bg-black/40 border border-white/10 rounded-2xl flex items-center justify-center text-indigo-400 shadow-2xl backdrop-blur-md">
            <Activity size={32} />
          </div>
        </div>

        {/* Branding Typography */}
        <h1 className="text-3xl font-black tracking-tight leading-none bg-gradient-to-b from-white via-white to-slate-500 bg-clip-text text-transparent text-center mb-2">
          Agent Flow Enterprise
        </h1>
        <p className="text-slate-500 text-[11px] uppercase tracking-[0.25em] font-bold mb-8 flex items-center gap-2">
          <Globe size={10} className="text-slate-600" /> 
          Autonomous intelligence matrix
        </p>

        {/* Immersive Glassmorphism Login Card */}
        <div className="w-full bg-white/[0.01] border border-white/[0.06] rounded-3xl p-8 backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.3)] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent"></div>
          
          <div className="text-center mb-8">
            <h2 className="font-bold text-lg text-white mb-1.5">Admin Gateway</h2>
            <p className="text-xs text-slate-400 font-medium">Authenticate to access workspace nodes.</p>
          </div>

          {error && (
            <div className="mb-6 p-3.5 bg-red-500/5 border border-red-500/20 rounded-xl text-xs text-red-400 text-center font-medium flex gap-2 items-center justify-center animate-shake">
              <Shield size={14} /> {error}
            </div>
          )}

          {/* The Big Login Button */}
          <motion.button
            whileHover={{ scale: 1.01, backgroundColor: "rgba(255,255,255,0.04)" }}
            whileTap={{ scale: 0.99 }}
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full relative group flex items-center justify-center gap-3 bg-white/[0.02] border border-white/10 rounded-xl py-3 px-4 transition-all active:scale-[0.98] select-none cursor-pointer hover:border-white/20 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin shrink-0"></div>
            ) : (
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5.04c1.64 0 3.11.56 4.27 1.67l3.19-3.19C17.53 1.63 14.95 1 12 1 7.35 1 3.35 3.68 1.43 7.61l3.77 2.93c.9-2.69 3.42-4.5 6.8-4.5z"/>
                <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.28 1.48-1.12 2.74-2.38 3.58l3.77 2.93c2.2-2.03 3.64-5.02 3.64-8.66z"/>
                <path fill="#FBBC05" d="M5.2 14.66c-.23-.68-.36-1.41-.36-2.16s.13-1.48.36-2.16L1.43 7.61A11.962 11.962 0 000 12c0 1.61.32 3.15.89 4.55l4.31-3.35v-.54z"/>
                <path fill="#34A853" d="M12 23c3.24 0 5.95-1.08 7.93-2.91l-3.77-2.93c-1.08.72-2.45 1.16-4.16 1.16-3.38 0-5.9-1.81-6.8-4.5L1.43 16.82C3.35 20.32 7.35 23 12 23z"/>
              </svg>
            )}
            <span className="text-[13px] font-bold tracking-wide text-slate-200">
              {loading ? "Establishing Auth Bridge..." : "Sign in with Google"}
            </span>
          </motion.button>

          <div className="mt-8 flex items-center justify-center gap-1.5">
            <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[9px] text-slate-600 font-bold uppercase tracking-widest font-mono">
              Secure Cryptographic Vault
            </span>
          </div>
        </div>

        {/* Footer Metadata */}
        <div className="mt-10 text-center flex items-center gap-1 text-[10px] font-bold text-slate-700 font-mono uppercase tracking-[0.15em]">
          <Sparkles size={10} className="text-slate-800 animate-spin-slow" /> Built on Gemini & Firebase
        </div>

      </motion.div>
    </div>
  );
}
