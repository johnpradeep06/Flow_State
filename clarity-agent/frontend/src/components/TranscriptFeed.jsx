import { motion, AnimatePresence } from "framer-motion";

export default function TranscriptFeed({ transcript }) {
  // We display the last 6 items for a cleaner real-time caption feed
  const recentTranscripts = transcript.slice(-6);

  return (
    <div className="h-full flex flex-col justify-end py-2 pr-2 overflow-hidden">
      <AnimatePresence initial={false}>
        {recentTranscripts.map((t, i) => {
          // Natural fade-out hierarchy
          const maxIdx = recentTranscripts.length - 1;
          const opacityVal = maxIdx === 0 ? 1 : 0.3 + (0.7 * (i / maxIdx));
          
          // Distinguish current speaker vs legacy rows
          const isLast = i === maxIdx;

          return (
            <motion.div 
              key={`${t.speaker}-${t.ts || i}-${t.text.substring(0, 15)}`}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ 
                opacity: opacityVal, 
                y: 0, 
                scale: 1,
                transition: { type: "spring", stiffness: 300, damping: 30 } 
              }}
              exit={{ opacity: 0, y: -10, scale: 0.98, transition: { duration: 0.2 } }}
              className={`mb-4 text-[19px] leading-relaxed font-medium select-none ${
                isLast ? "text-white font-semibold" : "text-gray-400"
              }`}
            >
              <span className={`mr-3 text-base font-bold uppercase tracking-wide ${
                isLast ? "text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20" : "text-gray-500"
              }`}>
                {t.speaker}
              </span>
              <span className="tracking-tight">
                {t.text}
              </span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
