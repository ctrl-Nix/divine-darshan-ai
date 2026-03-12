import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Phone, Sparkles, BookOpen, GraduationCap, Heart, User, HelpCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import krishnaImg from "@/assets/krishna-mahabharat.png";

/* ── Verse data by character type ── */
type CharacterType = "student" | "normal" | "elder";

const CHARACTER_TABS: { key: CharacterType; label: string; icon: typeof User }[] = [
  { key: "student", label: "Student", icon: GraduationCap },
  { key: "normal", label: "Seeker", icon: User },
  { key: "elder", label: "Elder", icon: Heart },
];

const VERSES: Record<CharacterType, { sanskrit: string; translation: string; ref: string }> = {
  student: {
    sanskrit: "योगस्थः कुरु कर्माणि सङ्गं त्यक्त्वा धनञ्जय।",
    translation:
      "Perform your duties with a steady mind, letting go of attachment to results — focus on the action, not the fruit.",
    ref: "Ch 2, Verse 48",
  },
  normal: {
    sanskrit: "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।",
    translation:
      "You have the right to act, but never to the fruit of action. Let not the results be your motive.",
    ref: "Ch 2, Verse 47",
  },
  elder: {
    sanskrit: "नैनं छिन्दन्ति शस्त्राणि नैनं दहति पावकः।",
    translation:
      "The soul is eternal — it cannot be cut, burned, or destroyed. Find peace in this timeless truth.",
    ref: "Ch 2, Verse 23",
  },
};

const MOOD_CHIPS = [
  { emoji: "😟", label: "Anxious" },
  { emoji: "😕", label: "Confused" },
  { emoji: "😢", label: "Heartbroken" },
  { emoji: "😤", label: "Angry" },
  { emoji: "🕊️", label: "Seeking Peace" },
  { emoji: "🤔", label: "Lost Purpose" },
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
  const [character, setCharacter] = useState<CharacterType>("normal");
  const navigate = useNavigate();

  const handleMoodClick = (label: string) => {
    setSelectedMood(label);
    setTimeout(() => onStartChat(), 400);
  };

  const verse = VERSES[character];

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="relative min-h-[100dvh] flex items-start justify-center overflow-y-auto bg-fluid-gradient"
    >
      {/* Safe area padding for top-right controls */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-lg mx-auto px-5 pt-14 sm:pt-12 pb-8 sm:pb-12">

        {/* ── Krishna Avatar ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ ...spring, delay: 0.1 }}
          className="relative mb-5"
        >
          <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full overflow-hidden glass-strong shadow-divine">
            <img
              src={krishnaImg}
              alt="Krishna — compassionate gaze"
              className="w-full h-full object-cover"
              loading="eager"
            />
          </div>
          <motion.div
            className="absolute -inset-2.5 rounded-full border border-primary/12"
            animate={{ rotate: 360 }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          />
          <div className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full bg-accent border-2 border-background" />
        </motion.div>

        {/* ── Title ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.18 }}
          className="text-center mb-5"
        >
          <p className="text-primary/45 font-body text-[9px] sm:text-[10px] tracking-[0.35em] uppercase mb-1.5">
            ॐ श्री कृष्णाय नमः
          </p>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-normal mb-1.5 leading-[1.1]">
            <span className="shimmer-text">Gita AI</span>
          </h1>
          <p className="text-muted-foreground font-body text-xs sm:text-sm leading-relaxed max-w-[260px] mx-auto">
            Verse-grounded guidance from the Bhagavad Gita
          </p>
        </motion.div>

        {/* ── Character Selector ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.26 }}
          className="flex items-center gap-0.5 p-1 rounded-2xl glass mb-5"
        >
          {CHARACTER_TABS.map((tab) => {
            const Icon = tab.icon;
            const active = character === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setCharacter(tab.key)}
                className={`relative flex items-center gap-1 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-body font-medium transition-all duration-200 ${
                  active
                    ? "text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="character-pill"
                    className="absolute inset-0 rounded-xl bg-gradient-divine shadow-divine"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1">
                  <Icon size={12} />
                  {tab.label}
                </span>
              </button>
            );
          })}
        </motion.div>

        {/* ── Verse of the Day Card ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={character}
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ ...spring, delay: 0.04 }}
            className="w-full mb-7 sm:mb-8"
          >
            <div className="verse-card relative rounded-2xl p-4 sm:p-5 glass-strong border border-[hsl(var(--divine-gold)/0.25)] shloka-glow">
              <div className="absolute top-2.5 right-2.5">
                <BookOpen size={12} className="text-primary/25" />
              </div>

              <p className="text-[9px] sm:text-[10px] font-body tracking-[0.25em] uppercase text-primary/45 mb-2.5">
                Verse of the Day
              </p>

              <p className="font-display text-sm sm:text-base md:text-lg text-foreground/90 leading-relaxed mb-2.5 italic">
                "{verse.sanskrit}"
              </p>

              <div className="w-10 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent mb-2.5" />

              <p className="font-body text-xs sm:text-sm text-muted-foreground leading-relaxed mb-2.5">
                {verse.translation}
              </p>

              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/8 text-[9px] sm:text-[10px] font-body font-medium text-primary/60 tracking-wide">
                📖 {verse.ref}
              </span>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* ── Mood Chips ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.38 }}
          className="w-full mb-7 sm:mb-8"
        >
          <p className="text-center text-muted-foreground font-body text-[11px] sm:text-xs mb-3 tracking-wide">
            How are you feeling today?
          </p>
          <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
            {MOOD_CHIPS.map((mood, i) => (
              <motion.button
                key={mood.label}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring, delay: 0.42 + i * 0.04 }}
                whileTap={{ scale: 0.93 }}
                onClick={() => handleMoodClick(mood.label)}
                className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl glass text-[11px] sm:text-xs font-body font-medium transition-all duration-200 ${
                  selectedMood === mood.label
                    ? "border-primary/40 bg-primary/10 text-primary shadow-divine"
                    : "text-foreground/55 hover:text-foreground hover:border-primary/20"
                }`}
              >
                <span className="text-xs sm:text-sm">{mood.emoji}</span>
                <span>{mood.label}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* ── CTA Buttons ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.52 }}
          className="flex items-center gap-2.5 mb-8 sm:mb-10"
        >
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onStartChat}
            className="group flex items-center justify-center gap-2 px-5 sm:px-7 py-3 sm:py-3.5 rounded-2xl bg-gradient-divine font-body text-xs sm:text-sm font-semibold text-primary-foreground shadow-divine hover:shadow-[0_4px_32px_-4px_hsl(var(--primary)/0.35)] transition-all duration-300"
          >
            <MessageCircle size={15} />
            Start Conversation
            <Sparkles size={12} className="opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onStartCall}
            className="flex items-center justify-center gap-2 px-5 sm:px-7 py-3 sm:py-3.5 rounded-2xl glass font-body text-xs sm:text-sm font-medium text-foreground/75 hover:text-foreground hover:border-primary/30 transition-all duration-300"
          >
            <Phone size={15} />
            Voice Call
          </motion.button>
        </motion.div>

        {/* ── Stats ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.62 }}
          className="flex items-center gap-8 sm:gap-10 mb-6"
        >
          {[
            { value: "18", label: "Chapters" },
            { value: "700", label: "Shlokas" },
            { value: "∞", label: "Wisdom" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-base sm:text-lg font-display text-primary">{stat.value}</p>
              <p className="text-[8px] sm:text-[9px] text-muted-foreground font-body uppercase tracking-[0.2em] mt-0.5">
                {stat.label}
              </p>
            </div>
          ))}
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.75 }}
          className="text-muted-foreground/35 font-body text-[9px] sm:text-[10px] tracking-wide"
        >
          Radhe Radhe 🙏
        </motion.p>
      </div>
    </motion.section>
  );
};

export default HeroSection;
