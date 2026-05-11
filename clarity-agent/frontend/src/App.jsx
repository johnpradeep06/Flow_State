import { useState } from "react";
import { useSessionStore } from "./store/sessionStore";
import { useWebSocket } from "./hooks/useWebSocket";
import AmbiguityCard from "./components/AmbiguityCard";
import TranscriptFeed from "./components/TranscriptFeed";
import SessionControls from "./components/SessionControls";
import { Activity, AlertCircle, CheckCircle2 } from "lucide-react";

export default function App() {
  const [running, setRunning] = useState(false);
  const { transcript, ambiguities, resolved, addTranscript, addAmbiguity, resolve } = useSessionStore();

  useWebSocket((msg) => {
    if (msg.type === "transcript") addTranscript(msg.data);
    if (msg.type === "ambiguity") addAmbiguity(msg.data);
  });

  const startSession = async (meetUrl, webhookUrl) => {
    try {
      await fetch("http://localhost:8000/session/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meet_url: meetUrl, webhook_url: webhookUrl }),
      });
      setRunning(true);
    } catch (err) {
      console.error("Failed to start session", err);
    }
  };

  const stopSession = async () => {
    try {
      await fetch("http://localhost:8000/session/stop", { method: "POST" });
      setRunning(false);
    } catch (err) {
      console.error("Failed to stop session", err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 min-h-screen flex flex-col">
      <header className="mb-6 flex items-center gap-3">
        <div className="bg-primary/20 p-2 rounded-lg text-primary">
          <Activity size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Flow</h1>
          <p className="text-gray-400 text-sm">Live ambiguity detection</p>
        </div>
      </header>

      <SessionControls onStart={startSession} onStop={stopSession} running={running} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 h-[calc(100vh-180px)]">
        {/* LEFT: Live transcript */}
        <div className="bg-surface border border-white/5 rounded-2xl p-5 flex flex-col shadow-xl">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/5">
            <h2 className="text-base font-semibold flex items-center gap-2">
              Live Transcript
            </h2>
            {running && (
              <span className="flex items-center gap-1.5 text-red-400 text-xs font-bold uppercase tracking-widest bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                Live
              </span>
            )}
          </div>
          <div className="flex-1 overflow-hidden relative">
            <div className="absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-surface to-transparent z-10 pointer-events-none"></div>
            <TranscriptFeed transcript={transcript} />
            <div className="absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-surface to-transparent z-10 pointer-events-none"></div>
          </div>
        </div>

        {/* RIGHT: Ambiguity flags */}
        <div className="bg-surface border border-white/5 rounded-2xl p-5 overflow-y-auto shadow-xl relative custom-scrollbar">
          <div className="sticky top-0 bg-surface/90 backdrop-blur pb-4 mb-4 border-b border-white/5 z-20">
            <h2 className="text-base font-semibold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <AlertCircle className="text-orange-400" size={18} />
                Ambiguity Pipeline
              </span>
              <span className="bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-lg text-xs font-bold px-2.5 py-1">
                {ambiguities.length} Active
              </span>
            </h2>
            <div className="flex items-center gap-1 text-gray-400 text-xs mt-2">
              <CheckCircle2 size={12} className="text-emerald-500" />
              {resolved.length} clarified this session
            </div>
          </div>

          {ambiguities.length === 0 && (
            <div className="h-40 flex flex-col items-center justify-center text-gray-500">
              <AlertCircle size={32} className="mb-3 opacity-20" />
              <p className="text-sm">No ambiguities detected yet</p>
            </div>
          )}

          <div className="space-y-4">
            {ambiguities.map((flag, i) => (
              <AmbiguityCard key={i} flag={flag} onResolve={resolve} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
