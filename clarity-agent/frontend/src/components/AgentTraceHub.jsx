import { motion, AnimatePresence } from "framer-motion";
import { useSessionStore } from "../store/sessionStore";
import { 
  Cpu, 
  Radar, 
  CheckCircle2, 
  AlertTriangle,
  Activity
} from "lucide-react";

export default function AgentTraceHub() {
  const agentStates = useSessionStore((s) => s.agentStates);

  // Live Swarm pipeline definition
  const agents = [
    {
      id: "NoiseFilter",
      name: "Noise Filter",
      icon: Radar,
      description: "Context Evaluator",
    },
    {
      id: "AmbiguityHunter",
      name: "Ambiguity Hunter",
      icon: Cpu,
      description: "Targeting Elicitor",
    },
    {
      id: "CriticRefiner",
      name: "Critic Refiner",
      icon: CheckCircle2,
      description: "Quality Gate",
    },
  ];

  const isAnyActive = Object.values(agentStates).some((val) => val?.state === "running");

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="relative w-full bg-surface/40 backdrop-blur-md border border-white/5 rounded-2xl p-3 px-4 mb-6 overflow-hidden"
    >
      {/* Thin glowing progress bar at top if swarm is operating */}
      <AnimatePresence>
        {isAnyActive && (
          <motion.div 
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            exit={{ opacity: 0 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute top-0 left-0 h-[1px] bg-gradient-to-r from-indigo-500 via-emerald-500 to-pink-500"
          />
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Pipeline Indicator Header */}
        <div className="flex items-center gap-2 shrink-0 pr-4 border-r border-white/5">
          <div className={`p-1.5 rounded-lg border ${isAnyActive ? "bg-indigo-500/20 border-indigo-500/30 text-indigo-400" : "bg-white/5 border-white/10 text-gray-400"}`}>
            <Activity size={14} className={isAnyActive ? "animate-pulse" : ""} />
          </div>
          <div>
            <div className="text-[11px] font-black tracking-widest uppercase text-gray-400">Agent Engine</div>
            <div className="text-[10px] text-gray-500">Live Swarm Trace</div>
          </div>
        </div>

        {/* Nodes Pipeline */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
          {agents.map((agent, idx) => {
            const activeState = agentStates[agent.id] || { status: "Standby...", state: "idle" };
            const isRunning = activeState.state === "running";
            const isSuccess = activeState.state === "success";
            const isFailed = activeState.state === "failed";

            // Node style definitions
            let ringColor = "border-white/10 bg-white/5";
            let iconColor = "text-gray-500";
            
            if (isRunning) {
              ringColor = "border-indigo-500/50 bg-indigo-950/30";
              iconColor = "text-indigo-400";
            } else if (isSuccess) {
              ringColor = "border-emerald-500/40 bg-emerald-950/20";
              iconColor = "text-emerald-400";
            } else if (isFailed) {
              ringColor = "border-rose-500/40 bg-rose-950/20";
              iconColor = "text-rose-400";
            }

            const Icon = agent.icon;

            return (
              <motion.div 
                key={agent.id}
                layout
                className={`flex items-center gap-3 p-2 px-3 rounded-xl border transition-all duration-300 ${
                  isRunning ? "border-white/10 bg-white/[0.02] shadow-[inset_0_0_12px_rgba(99,102,241,0.05)]" : "border-transparent bg-transparent"
                }`}
              >
                {/* Pulse Node Sphere */}
                <div className="relative shrink-0 w-7 h-7 flex items-center justify-center">
                  {isRunning && (
                    <span className="absolute inset-0 rounded-full bg-indigo-500/30 pulse-ring" />
                  )}
                  <div className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center border ${ringColor} transition-colors duration-500`}>
                    {isFailed ? (
                      <AlertTriangle size={12} className="text-rose-400" />
                    ) : (
                      <Icon size={12} className={`${iconColor} transition-colors duration-500`} />
                    )}
                  </div>
                </div>

                {/* Node Label & Status text */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 justify-between">
                    <span className={`text-xs font-bold tracking-tight ${isRunning ? "text-white" : isSuccess ? "text-emerald-400/90" : "text-gray-300"}`}>
                      {agent.name}
                    </span>
                    {isRunning && (
                      <span className="text-[9px] font-semibold uppercase bg-indigo-500/10 text-indigo-400 px-1 rounded flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-indigo-400 animate-ping" />
                        Active
                      </span>
                    )}
                  </div>
                  
                  {/* Animated Text Status Update */}
                  <div className="h-4 relative overflow-hidden mt-0.5">
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={activeState.status}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.2 }}
                        className={`text-[10px] truncate leading-none ${
                          isRunning ? "text-gray-200 font-medium" : isSuccess ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        {activeState.status}
                      </motion.p>
                    </AnimatePresence>
                  </div>
                </div>
                
                {/* Divider Chevron for Pipeline (Except Last) */}
                {idx < 2 && (
                  <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 text-white/10 font-thin text-xs select-none pointer-events-none pr-2">
                    ➔
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
