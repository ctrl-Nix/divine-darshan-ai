import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Heart, BookOpen } from "lucide-react";

const DisclaimerDialog = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setOpen(true), 800);
    return () => clearTimeout(timer);
  }, []);

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setOpen(false)}
          />

          {/* Card */}
          <motion.div
            className="relative z-10 max-w-md w-full bg-card border border-primary/30 rounded-3xl overflow-hidden shadow-divine"
            initial={{ scale: 0.7, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 20, stiffness: 250 }}
          >
            {/* Top glow bar */}
            <div className="h-1.5 w-full bg-gradient-divine" />

            {/* Floating Om */}
            <motion.div
              className="absolute top-4 right-4 text-3xl opacity-20"
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              🕉️
            </motion.div>

            <div className="p-6 pt-5 text-center">
              {/* Icon */}
              <motion.div
                className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center"
                animate={{ boxShadow: ["0 0 0px hsl(36 90% 55% / 0)", "0 0 25px hsl(36 90% 55% / 0.3)", "0 0 0px hsl(36 90% 55% / 0)"] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <span className="text-3xl">🪷</span>
              </motion.div>

              <h2 className="font-display text-2xl font-bold text-foreground mb-1">
                Radhe Radhe 🙏
              </h2>
              <p className="text-primary font-body text-sm mb-4 tracking-wide">
                ॐ श्री कृष्णाय नमः
              </p>

              {/* Disclaimer points */}
              <div className="space-y-3 text-left mb-5">
                <motion.div
                  className="flex items-start gap-3 bg-secondary/50 rounded-xl p-3 border border-border"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <Sparkles size={18} className="text-primary mt-0.5 shrink-0" />
                  <p className="text-sm text-foreground/90 font-body">
                    I am an <span className="font-semibold text-primary">AI margdarshak</span> (guide), not Lord Krishna. I humbly share His teachings as a messenger.
                  </p>
                </motion.div>

                <motion.div
                  className="flex items-start gap-3 bg-secondary/50 rounded-xl p-3 border border-border"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.45 }}
                >
                  <BookOpen size={18} className="text-primary mt-0.5 shrink-0" />
                  <p className="text-sm text-foreground/90 font-body">
                    All guidance is based <span className="font-semibold text-primary">entirely on the Bhagavad Gita</span>. My knowledge comes from the sacred 700 shlokas.
                  </p>
                </motion.div>

                <motion.div
                  className="flex items-start gap-3 bg-secondary/50 rounded-xl p-3 border border-border"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <Heart size={18} className="text-primary mt-0.5 shrink-0" />
                  <p className="text-sm text-foreground/90 font-body">
                    Created with devotion by <span className="font-semibold text-primary">Shreyanshi Singh</span> 🙏
                  </p>
                </motion.div>
              </div>

              {/* Accept button */}
              <motion.button
                whileHover={{ scale: 1.04, boxShadow: "0 0 30px hsl(36 90% 55% / 0.4)" }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setOpen(false)}
                className="w-full py-3.5 rounded-2xl bg-gradient-divine font-body font-semibold text-primary-foreground shadow-divine transition-all duration-300 flex items-center justify-center gap-2 text-base"
              >
                <span>🙏</span> I Understand — Begin Journey
              </motion.button>

              <p className="text-muted-foreground text-xs mt-3 font-body opacity-70">
                हरे कृष्ण हरे कृष्ण कृष्ण कृष्ण हरे हरे
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DisclaimerDialog;
