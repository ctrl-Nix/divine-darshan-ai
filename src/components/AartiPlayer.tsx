import { useState } from "react";
import { Music, Play, Pause } from "lucide-react";

// Hare Krishna mahamantra YouTube ID (loopable chanting)
const YT_ID = "fIY37yliVRs";

const AartiPlayer = () => {
  const [playing, setPlaying] = useState(false);

  return (
    <>
      {/* hidden audio iframe */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          width: 1,
          height: 1,
          left: -9999,
          top: -9999,
          overflow: "hidden",
        }}
      >
        {playing && (
          <iframe
            title="Hare Krishna Mahamantra"
            width="1"
            height="1"
            src={`https://www.youtube.com/embed/${YT_ID}?autoplay=1&loop=1&playlist=${YT_ID}&controls=0`}
            allow="autoplay"
          />
        )}
      </div>

      <div className="fixed bottom-0 inset-x-0 z-40 pointer-events-none">
        <div className="mx-auto max-w-md px-3 pb-2 pointer-events-auto">
          <div className="flex items-center gap-3 px-3 py-2 rounded-full glass-strong border border-[hsl(var(--divine-gold)/0.3)] shadow-divine">
            <Music
              size={14}
              className="text-[hsl(var(--divine-gold))] shrink-0"
            />
            <span className="font-display text-[11px] sm:text-xs text-foreground/80 flex-1 truncate">
              Hare Krishna Mahamantra
            </span>
            <button
              onClick={() => setPlaying((p) => !p)}
              aria-label={playing ? "Pause" : "Play"}
              className="w-7 h-7 rounded-full bg-gradient-divine flex items-center justify-center text-primary-foreground shadow-divine"
            >
              {playing ? <Pause size={12} /> : <Play size={12} />}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AartiPlayer;
