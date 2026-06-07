import { useEffect, useRef, useState } from "react";
import { Music, Play, Pause, Loader2 } from "lucide-react";
import { toast } from "sonner";

// Reliable Hare Krishna Mahamantra audio (public archive.org recording)
const AUDIO_URL =
  "https://archive.org/download/HareKrishnaMahaMantra_201805/Hare%20Krishna%20Maha%20Mantra.mp3";

const AartiPlayer = () => {
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(AUDIO_URL);
    audio.loop = true;
    audio.preload = "none";
    audio.volume = 0.8;
    audioRef.current = audio;
    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  const toggle = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }
    try {
      setLoading(true);
      await audio.play();
      setPlaying(true);
    } catch (e) {
      console.error("Aarti playback failed", e);
      toast.error("Couldn't play the mahamantra. Tap again or check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 pointer-events-none">
      <div className="mx-auto max-w-md px-3 pb-2 pointer-events-auto">
        <div className="flex items-center gap-3 px-3 py-2 rounded-full glass-strong border border-[hsl(var(--divine-gold)/0.3)] shadow-divine">
          <Music size={14} className="text-[hsl(var(--divine-gold))] shrink-0" />
          <span className="font-display text-[11px] sm:text-xs text-foreground/80 flex-1 truncate">
            Hare Krishna Mahamantra
          </span>
          <button
            onClick={toggle}
            aria-label={playing ? "Pause" : "Play"}
            disabled={loading}
            className="w-7 h-7 rounded-full bg-gradient-divine flex items-center justify-center text-primary-foreground shadow-divine disabled:opacity-60"
          >
            {loading ? (
              <Loader2 size={12} className="animate-spin" />
            ) : playing ? (
              <Pause size={12} />
            ) : (
              <Play size={12} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AartiPlayer;
