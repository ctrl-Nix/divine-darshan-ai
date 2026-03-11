import { motion } from "framer-motion";
import { Sun, Moon, Eye } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

const AccessibilityControls = () => {
  const { theme, toggleTheme, textSize, cycleTextSize, highContrast, toggleHighContrast } = useTheme();

  const sizeLabel = textSize === "normal" ? "A" : textSize === "large" ? "A+" : "A++";

  const btnBase =
    "flex items-center justify-center w-8 h-8 rounded-full backdrop-blur-md border transition-all duration-200 active:scale-90 text-xs";
  const btnIdle =
    "bg-card/60 border-border/40 text-foreground/60 hover:text-foreground hover:border-primary/30 hover:bg-card/80";

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.6 }}
      className="fixed top-3 right-3 z-[60] flex items-center gap-1"
    >
      {/* Text size */}
      <button
        onClick={cycleTextSize}
        className={`${btnBase} ${btnIdle}`}
        title="Adjust text size"
        aria-label={`Text size: ${textSize}`}
      >
        <span className="font-body font-bold leading-none">{sizeLabel}</span>
      </button>

      {/* High contrast */}
      <button
        onClick={toggleHighContrast}
        className={`${btnBase} ${
          highContrast
            ? "bg-foreground text-background border-foreground"
            : btnIdle
        }`}
        title="Toggle high contrast"
        aria-label={`High contrast: ${highContrast ? "on" : "off"}`}
      >
        <Eye size={13} />
      </button>

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className={`${btnBase} ${btnIdle}`}
        title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        aria-label={`Theme: ${theme}`}
      >
        <motion.div
          key={theme}
          initial={{ rotate: -30, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          {theme === "dark" ? <Sun size={13} /> : <Moon size={13} />}
        </motion.div>
      </button>
    </motion.div>
  );
};

export default AccessibilityControls;
