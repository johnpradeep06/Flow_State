import { useEffect, useRef } from "react";

export default function TranscriptFeed({ transcript }) {
  // Only keep the last 6 items for live captions
  const recentTranscripts = transcript.slice(-6);

  return (
    <div className="h-full flex flex-col justify-end py-2 pr-2 overflow-hidden">
      {recentTranscripts.map((t, i) => {
        // Calculate opacity based on position (newest is fully opaque, oldest fades out)
        // Using Math.max to handle case where there is only 1 item
        const opacity = recentTranscripts.length === 1 ? 1 : 0.2 + (0.8 * (i / (recentTranscripts.length - 1)));
        
        return (
          <div 
            key={`${i}-${t.text.substring(0, 20)}`}
            className="mb-4 text-xl leading-relaxed text-gray-200 transition-all duration-500 animate-slideIn" 
            style={{ opacity }}
          >
            <span className="font-semibold text-primary mr-3 text-lg">
              {t.speaker}:
            </span>
            {t.text}
          </div>
        );
      })}
    </div>
  );
}
