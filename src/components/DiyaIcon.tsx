import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Singing bowl sound via Web Audio API
const playSingingBowl = () => {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();

    // Primary tone — singing bowl fundamental
    osc.type = "sine";
    osc.frequency.setValueAtTime(528, ctx.currentTime); // Solfeggio frequency
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.8);

    // Harmonic overtone
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(1056, ctx.currentTime);
    gain2.gain.setValueAtTime(0.03, ctx.currentTime);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

    osc.connect(gain).connect(ctx.destination);
    osc2.connect(gain2).connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc2.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 2);
    osc2.stop(ctx.currentTime + 1.5);

    setTimeout(() => ctx.close(), 2500);
  } catch {
    // Silently fail if AudioContext unavailable
  }
};

const DiyaIcon = () => {
  const [showTooltip, setShowTooltip] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const handleInteraction = useCallback(() => {
    setShowTooltip(true);
    playSingingBowl();
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setShowTooltip(false), 5000);
  }, []);

  const handleMouseEnter = useCallback(() => {
    setShowTooltip(true);
    clearTimeout(timeoutRef.current);
  }, []);

  const handleMouseLeave = useCallback(() => {
    timeoutRef.current = setTimeout(() => setShowTooltip(false), 800);
  }, []);

  return (
    <div className="relative inline-flex">
      <button
        onClick={handleInteraction}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="diya-container group p-1 rounded-lg hover:bg-primary/5 transition-colors duration-200"
        aria-label="Wisdom lamp — tap for guidance disclaimer"
      >
        {/* Diya flame */}
        <div className="relative w-5 h-5 flex items-center justify-center">
          {/* Glow */}
          <div className="absolute inset-0 rounded-full bg-primary/20 blur-sm diya-glow" />

          {/* Lamp SVG */}
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            className="relative z-10"
            fill="none"
          >
            {/* Lamp base */}
            <path
              d="M8 18h8M9 18c0-2 3-3 3-3s3 1 3 3"
              stroke="hsl(var(--primary))"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            {/* Oil vessel */}
            <ellipse
              cx="12"
              cy="15"
              rx="4"
              ry="1.5"
              fill="hsl(var(--primary))"
              opacity="0.3"
            />
            {/* Flame */}
            <path
              d="M12 5c0 0-2.5 3-2.5 5.5C9.5 12.5 10.6 14 12 14s2.5-1.5 2.5-3.5C14.5 8 12 5 12 5z"
              fill="hsl(var(--divine-gold))"
              className="diya-flame"
            />
            {/* Inner flame */}
            <path
              d="M12 8c0 0-1 1.5-1 2.8C11 11.8 11.5 12.5 12 12.5s1-0.7 1-1.7C13 9.5 12 8 12 8z"
              fill="hsl(var(--saffron-glow))"
              className="diya-flame-inner"
            />
          </svg>
        </div>
      </button>

      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="absolute bottom-full left-0 mb-2 z-30 w-64"
          >
            <div className="glass-strong rounded-xl px-4 py-3 shadow-divine">
              <p className="text-[11px] font-body text-foreground/80 leading-[1.7]">
                <span className="text-primary font-semibold">🪔</span>{" "}
                Like a lamp shows the path but is not the path itself, this AI
                points to the Gita's truths.{" "}
                <span className="text-foreground/90 font-medium">
                  Verify these insights with your Guru, elders, or the original
                  Shlokas.
                </span>
              </p>
            </div>
            {/* Arrow */}
            <div className="ml-4 w-2 h-2 rotate-45 glass-strong border-t-0 border-l-0 -mt-1" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DiyaIcon;
