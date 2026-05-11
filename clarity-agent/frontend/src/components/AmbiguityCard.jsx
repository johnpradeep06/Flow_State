import { CheckCircle } from 'lucide-react';

const TYPE_COLOR = {
  vague_quality:       { bg: "bg-orange-500/10", border: "border-orange-500/30", text: "text-orange-400", label: "Vague quality" },
  missing_metric:      { bg: "bg-yellow-500/10", border: "border-yellow-500/30", text: "text-yellow-400", label: "Missing metric" },
  undefined_reference: { bg: "bg-indigo-500/10", border: "border-indigo-500/30", text: "text-indigo-400", label: "Undefined reference" },
  assumption:          { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-400", label: "Assumption" },
  scope:               { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400", label: "Scope creep" },
};

export default function AmbiguityCard({ flag, onResolve }) {
  const c = TYPE_COLOR[flag.type] || TYPE_COLOR.assumption;
  return (
    <div className={`border ${c.border} ${c.bg} rounded-xl p-4 mb-4 animate-slideIn backdrop-blur-sm shadow-lg transition-transform hover:scale-[1.02]`}>
      <span className={`text-[11px] font-bold ${c.text} bg-black/20 px-2 py-1 rounded-md inline-block mb-2 uppercase tracking-wider`}>
        {c.label}
      </span>
      <p className="mb-2 italic text-gray-200 text-sm">
        "{flag.quote}"
      </p>
      <p className="mb-4 text-gray-400 text-sm">
        {flag.suggestion}
      </p>
      <button
        onClick={() => onResolve(flag.quote)}
        className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded-lg px-4 py-2 cursor-pointer text-xs font-semibold transition-colors"
      >
        <CheckCircle size={14} />
        Clarified
      </button>
    </div>
  );
}
