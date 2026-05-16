import { useState } from "react";
import { Play, Square } from "lucide-react";

export default function SessionControls({ onStart, onStop, running }) {
  const [meetUrl, setMeetUrl] = useState("");
  const [customerName, setCustomerName] = useState("");

  return (
    <div className="flex gap-3 items-center mb-6 bg-surface p-4 rounded-xl border border-white/5 shadow-md flex-wrap md:flex-nowrap">
      <input
        placeholder="Google Meet URL"
        value={meetUrl}
        onChange={(e) => setMeetUrl(e.target.value)}
        className="flex-1 bg-obsidian text-white border border-white/10 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors min-w-[200px]"
      />
      <input
        placeholder="Customer's Full Name"
        value={customerName}
        onChange={(e) => setCustomerName(e.target.value)}
        className="flex-1 bg-obsidian text-white border border-white/10 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors min-w-[200px]"
      />
      {!running ? (
        <button
          onClick={() => onStart(meetUrl, "", customerName)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-6 py-2.5 text-sm font-semibold transition-colors whitespace-nowrap"
        >
          <Play size={16} />
          Start Session
        </button>
      ) : (
        <button
          onClick={onStop}
          className="flex items-center gap-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 rounded-lg px-6 py-2.5 text-sm font-semibold transition-colors whitespace-nowrap"
        >
          <Square size={16} />
          End Session
        </button>
      )}
    </div>
  );
}
