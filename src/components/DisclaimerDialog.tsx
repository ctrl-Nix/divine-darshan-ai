import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const DisclaimerDialog = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const seen = sessionStorage.getItem("gita-disclaimer-seen");
    if (!seen) {
      const timer = setTimeout(() => setOpen(true), 600);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setOpen(false);
    sessionStorage.setItem("gita-disclaimer-seen", "1");
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-background/80 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={handleClose}
          />

          {/* Card */}
          <motion.div
            className="relative z-10 max-w-sm w-full bg-card border border-border rounded-2xl overflow-hidden"
            initial={{ scale: 0.92, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Top accent */}
            <div className="h-px w-full bg-gradient-divine" />

            <div className="p-6">
              {/* Header */}
              <div className="text-center mb-5">
                <p className="text-2xl mb-2">🙏</p>
                <h2 className="font-display text-xl text-foreground mb-1">
                  Radhe Radhe
                </h2>
                <p className="text-primary/60 font-body text-[11px] tracking-[0.25em] uppercase">
                  ॐ श्री कृष्णाय नमः
                </p>
              </div>

              {/* Points */}
              <div className="space-y-2.5 mb-6">
                {[
                  {
                    emoji: "🪷",
                    text: (
                      <>
                        I am an <span className="text-primary font-medium">AI guide</span>, not Lord Krishna — a humble messenger of His teachings.
                      </>
                    ),
                  },
                  {
                    emoji: "📖",
                    text: (
                      <>
                        All guidance is based entirely on the{" "}
                        <span className="text-primary font-medium">Bhagavad Gita's 700 shlokas</span>.
                      </>
                    ),
                  },
                  {
                    emoji: "💛",
                    text: (
                      <>
                        Created with devotion by{" "}
                        <span className="text-primary font-medium">Shreyanshi Singh</span>.
                      </>
                    ),
                  },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    className="flex items-start gap-3 bg-secondary/40 rounded-xl p-3 border border-border/50"
                  >
                    <span className="text-base mt-0.5 shrink-0">{item.emoji}</span>
                    <p className="text-[13px] text-foreground/80 font-body leading-relaxed">
                      {item.text}
                    </p>
                  </motion.div>
                ))}
              </div>

              {/* Button */}
              <button
                onClick={handleClose}
                className="w-full py-3 rounded-xl bg-gradient-divine font-body text-sm font-semibold text-primary-foreground shadow-divine hover:shadow-[0_4px_32px_-4px_hsl(var(--primary)/0.35)] transition-all duration-300"
              >
                I Understand — Begin 🙏
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DisclaimerDialog;
