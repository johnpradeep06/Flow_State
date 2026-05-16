import { motion } from 'framer-motion';
import { CheckCircle, AlertOctagon, Target, HelpCircle, ShieldPlus } from 'lucide-react';

const TYPE_MAP = {
  vague_quality:       { name: "Vague Quality", color: "from-orange-500 to-amber-400", icon: HelpCircle },
  missing_metric:      { name: "Missing Metric", color: "from-yellow-500 to-yellow-300", icon: Target },
  undefined_reference: { name: "Undefined Ref", color: "from-indigo-500 to-violet-400", icon: AlertOctagon },
  assumption:          { name: "Assumption", color: "from-blue-500 to-cyan-400", icon: HelpCircle },
  scope:               { name: "Scope Risk", color: "from-emerald-500 to-teal-400", icon: ShieldPlus },
};

export default function AmbiguityCard({ flag, onResolve }) {
  const meta = TYPE_MAP[flag.type] || TYPE_MAP.assumption;
  const Icon = meta.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ 
        opacity: 0, 
        scale: 0.95, 
        x: 20, 
        transition: { duration: 0.2 } 
      }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="group relative bg-white/[0.01] border border-white/[0.06] rounded-2xl overflow-hidden shadow-lg flex backdrop-blur-md"
    >
      {/* Glowing Left Edge Accents */}
      <div className={`w-1 bg-gradient-to-b ${meta.color} shrink-0 group-hover:opacity-100 opacity-80 transition-opacity`} />
      
      <div className="flex-1 p-5 pl-6 flex flex-col">
        
        {/* Flag Header */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-1.5">
            <Icon className="text-slate-400" size={12} />
            <span className={`text-[10px] font-extrabold uppercase tracking-[0.15em] bg-gradient-to-r ${meta.color} bg-clip-text text-transparent`}>
              {meta.name}
            </span>
          </div>
          
          <span className="text-[8px] font-extrabold uppercase tracking-[0.12em] bg-white/[0.02] text-slate-400 border border-white/[0.06] px-2 py-0.5 rounded font-mono">
            ACTIVE FLAG
          </span>
        </div>

        {/* Verbatim Quote Bubble */}
        <div className="relative pl-3 border-l-2 border-white/10 mb-3">
          <p className="italic text-slate-200 text-[13px] leading-relaxed font-medium">
            "{flag.quote}"
          </p>
        </div>

        {/* Context/Question Prompt */}
        <p className="text-slate-400 text-xs mb-5 leading-relaxed group-hover:text-slate-300 transition-colors font-medium">
          {flag.suggestion}
        </p>

        {/* Resolution CTA */}
        <div className="mt-auto flex items-center justify-between pt-4 border-t border-white/[0.04]">
          <div className="text-[9px] text-slate-500 uppercase tracking-[0.1em] font-bold font-mono">
            Awaiting clarity...
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => onResolve(flag.quote)}
            className="flex items-center gap-1.5 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/20 rounded-xl px-4 py-2 cursor-pointer text-[11px] font-bold uppercase tracking-wider shadow-sm transition-all duration-200"
          >
            <CheckCircle size={12} className="shrink-0" />
            Mark Clarified
          </motion.button>
        </div>
      </div>

      {/* Hover Glow Radial Effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/[0.03] via-transparent to-transparent pointer-events-none transition-opacity duration-500" />
    </motion.div>
  );
}
