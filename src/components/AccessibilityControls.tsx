import { motion } from "framer-motion";
import { Sun, Moon, Eye, Type } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

const AccessibilityControls = () => {
  const { theme, toggleTheme, textSize, cycleTextSize, highContrast, toggleHighContrast } = useTheme();

  const sizeLabel = textSize === "normal" ? "A" : textSize === "large" ? "A+" : "A++";

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="fixed top-4 right-4 z-50 flex items-center gap-1.5"
    >
      {/* Text size */}
      <button
        onClick={cycleTextSize}
        className="group flex items-center justify-center w-9 h-9 rounded-xl bg-card/80 backdrop-blur-lg border border-border/50 text-foreground/70 hover:text-foreground hover:border-primary/30 transition-all duration-200 active:scale-90"
        title="Adjust text size"
        aria-label={`Text size: ${textSize}`}
      >
        <span className="text-xs font-body font-bold">{sizeLabel}</span>
      </button>

      {/* High contrast */}
      <button
        onClick={toggleHighContrast}
        className={`group flex items-center justify-center w-9 h-9 rounded-xl backdrop-blur-lg border transition-all duration-200 active:scale-90 ${
          highContrast
            ? "bg-foreground text-background border-foreground"
            : "bg-card/80 border-border/50 text-foreground/70 hover:text-foreground hover:border-primary/30"
        }`}
        title="Toggle high contrast"
        aria-label={`High contrast: ${highContrast ? "on" : "off"}`}
      >
        <Eye size={15} />
      </button>

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="group flex items-center justify-center w-9 h-9 rounded-xl bg-card/80 backdrop-blur-lg border border-border/50 text-foreground/70 hover:text-foreground hover:border-primary/30 transition-all duration-200 active:scale-90"
        title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        aria-label={`Theme: ${theme}`}
      >
        <motion.div
          key={theme}
          initial={{ rotate: -30, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
        </motion.div>
      </button>
    </motion.div>
  );
};

export default AccessibilityControls;
