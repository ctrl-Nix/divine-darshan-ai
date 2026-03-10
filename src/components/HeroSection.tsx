import { useState } from "react";
import { motion } from "framer-motion";
import { MessageCircle, Phone, Sparkles } from "lucide-react";
import krishnaImg from "@/assets/krishna-mahabharat.png";

const MOOD_CHIPS = [
  { emoji: "😟", label: "Anxious", labelHi: "चिंतित" },
  { emoji: "😕", label: "Confused", labelHi: "भ्रमित" },
  { emoji: "😢", label: "Heartbroken", labelHi: "टूटा दिल" },
  { emoji: "😤", label: "Angry", labelHi: "गुस्सा" },
  { emoji: "🕊️", label: "Seeking Peace", labelHi: "शांति" },
  { emoji: "🤔", label: "Lost Purpose", labelHi: "दिशाहीन" },
];

const spring = { type: "spring" as const, stiffness: 200, damping: 24 };

const HeroSection = ({
  onStartChat,
  onStartCall,
}: {
  onStartChat: () => void;
  onStartCall: () => void;
}) => {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);

  const handleMoodClick = (label: string) => {
    setSelectedMood(label);
    // Small delay so user sees selection, then open chat
    setTimeout(() => onStartChat(), 400);
  };

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-fluid-gradient"
    >
      <div className="relative z-10 flex flex-col items-center px-6 py-16 max-w-lg w-full">
        {/* Krishna avatar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ ...spring, delay: 0.1 }}
          className="relative mb-8"
        >
          <div className="w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden glass-strong shadow-divine">
            <img
              src={krishnaImg}
              alt="Krishna — compassionate gaze"
              className="w-full h-full object-cover"
              loading="eager"
            />
          </div>

          {/* Rotating ring */}
          <motion.div
            className="absolute -inset-3 rounded-full border border-primary/15"
            animate={{ rotate: 360 }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          />

          {/* Status dot */}
          <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-accent border-2 border-background" />
        </motion.div>

        {/* Title block */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.2 }}
          className="text-center mb-8"
        >
          <p className="text-primary/60 font-body text-[11px] tracking-[0.35em] uppercase mb-3">
            ॐ श्री कृष्णाय नमः
          </p>

          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-normal mb-4 leading-[1.1]">
            <span className="shimmer-text">Gita AI</span>
          </h1>

          <p className="text-foreground/80 font-body text-base md:text-lg leading-relaxed max-w-md mx-auto">
            Verse-grounded guidance from the Bhagavad Gita
          </p>
        </motion.div>

        {/* "How are you feeling?" */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.35 }}
          className="w-full mb-8"
        >
          <p className="text-center text-muted-foreground font-body text-sm mb-4">
            How are you feeling today?
          </p>

          <div className="flex flex-wrap justify-center gap-2">
            {MOOD_CHIPS.map((mood, i) => (
              <motion.button
                key={mood.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring, delay: 0.4 + i * 0.06 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => handleMoodClick(mood.label)}
                className={`group flex items-center gap-1.5 px-4 py-2.5 rounded-2xl glass text-sm font-body font-medium transition-all duration-200 active:scale-95 ${
                  selectedMood === mood.label
                    ? "border-primary/40 bg-primary/10 text-primary shadow-divine"
                    : "text-foreground/70 hover:text-foreground hover:border-primary/25 hover:shadow-sm"
                }`}
              >
                <span className="text-base">{mood.emoji}</span>
                <span>{mood.label}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.55 }}
          className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto mb-12"
        >
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onStartChat}
            className="group flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl bg-gradient-divine font-body text-sm font-semibold text-primary-foreground shadow-divine hover:shadow-[0_4px_32px_-4px_hsl(var(--primary)/0.35)] transition-all duration-300"
          >
            <MessageCircle size={17} />
            Start Conversation
            <Sparkles size={14} className="opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onStartCall}
            className="flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl glass font-body text-sm font-medium text-foreground/90 hover:border-primary/30 transition-all duration-300"
          >
            <Phone size={17} />
            Voice Call
          </motion.button>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="flex items-center gap-8 md:gap-12"
        >
          {[
            { value: "18", label: "Chapters" },
            { value: "700", label: "Shlokas" },
            { value: "∞", label: "Wisdom" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-xl md:text-2xl font-display text-primary">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground font-body uppercase tracking-[0.2em] mt-0.5">
                {stat.label}
              </p>
            </div>
          ))}
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-12 text-muted-foreground/50 font-body text-[11px] tracking-wide"
        >
          Radhe Radhe 🙏
        </motion.p>
      </div>
    </motion.section>
  );
};

export default HeroSection;
