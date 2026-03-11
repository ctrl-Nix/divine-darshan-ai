import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Phone, Sparkles, BookOpen, GraduationCap, Heart, User } from "lucide-react";
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
  const [character, setCharacter] = useState<CharacterType>("normal");

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
      className="relative min-h-screen flex items-start justify-center overflow-y-auto bg-fluid-gradient"
    >
      <div className="relative z-10 flex flex-col items-center px-6 pt-12 pb-20 max-w-lg w-full">
        {/* Krishna avatar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ ...spring, delay: 0.1 }}
          className="relative mb-6"
        >
          <div className="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden glass-strong shadow-divine">
            <img
              src={krishnaImg}
              alt="Krishna — compassionate gaze"
              className="w-full h-full object-cover"
              loading="eager"
            />
          </div>
          <motion.div
            className="absolute -inset-3 rounded-full border border-primary/15"
            animate={{ rotate: 360 }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          />
          <div className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-accent border-2 border-background" />
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.2 }}
          className="text-center mb-6"
        >
          <p className="text-primary/50 font-body text-[10px] tracking-[0.35em] uppercase mb-2">
            ॐ श्री कृष्णाय नमः
          </p>
          <h1 className="font-display text-4xl md:text-5xl font-normal mb-2 leading-[1.1]">
            <span className="shimmer-text">Gita AI</span>
          </h1>
          <p className="text-muted-foreground font-body text-sm leading-relaxed max-w-xs mx-auto">
            Verse-grounded guidance from the Bhagavad Gita
          </p>
        </motion.div>

        {/* ── Character Selector ── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.28 }}
          className="flex items-center gap-1 p-1 rounded-2xl glass mb-6"
        >
          {CHARACTER_TABS.map((tab) => {
            const Icon = tab.icon;
            const active = character === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setCharacter(tab.key)}
                className={`relative flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-body font-medium transition-all duration-200 ${
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
                <span className="relative z-10 flex items-center gap-1.5">
                  <Icon size={13} />
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
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ ...spring, delay: 0.05 }}
            className="w-full mb-10"
          >
            <div className="verse-card relative rounded-2xl p-5 md:p-6 glass-strong border border-[hsl(var(--divine-gold)/0.3)] shloka-glow">
              {/* Decorative corner */}
              <div className="absolute top-3 right-3">
                <BookOpen size={14} className="text-primary/30" />
              </div>

              <p className="text-[10px] font-body tracking-[0.25em] uppercase text-primary/50 mb-3">
                Verse of the Day
              </p>

              {/* Sanskrit */}
              <p className="font-display text-base md:text-lg text-foreground/90 leading-relaxed mb-3 italic">
                "{verse.sanskrit}"
              </p>

              {/* Divider */}
              <div className="w-12 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent mb-3" />

              {/* Translation */}
              <p className="font-body text-sm text-muted-foreground leading-relaxed mb-3">
                {verse.translation}
              </p>

              {/* Ref tag */}
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/8 text-[10px] font-body font-medium text-primary/70 tracking-wide">
                  📖 {verse.ref}
                </span>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* ── Mood Chips ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.4 }}
          className="w-full mb-10"
        >
          <p className="text-center text-muted-foreground font-body text-xs mb-4 tracking-wide">
            How are you feeling today?
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {MOOD_CHIPS.map((mood, i) => (
              <motion.button
                key={mood.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring, delay: 0.45 + i * 0.05 }}
                whileTap={{ scale: 0.93 }}
                onClick={() => handleMoodClick(mood.label)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl glass text-xs font-body font-medium transition-all duration-200 ${
                  selectedMood === mood.label
                    ? "border-primary/40 bg-primary/10 text-primary shadow-divine"
                    : "text-foreground/60 hover:text-foreground hover:border-primary/20"
                }`}
              >
                <span className="text-sm">{mood.emoji}</span>
                <span>{mood.label}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* ── CTA Buttons ── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.55 }}
          className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto mb-10"
        >
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onStartChat}
            className="group flex items-center justify-center gap-2.5 w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-divine font-body text-sm font-semibold text-primary-foreground shadow-divine hover:shadow-[0_4px_32px_-4px_hsl(var(--primary)/0.35)] transition-all duration-300"
          >
            <MessageCircle size={16} />
            Start Conversation
            <Sparkles size={13} className="opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onStartCall}
            className="flex items-center justify-center gap-2.5 w-full sm:w-auto px-7 py-3.5 rounded-2xl glass font-body text-sm font-medium text-foreground/80 hover:text-foreground hover:border-primary/30 transition-all duration-300"
          >
            <Phone size={16} />
            Voice Call
          </motion.button>
        </motion.div>

        {/* ── Stats ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.65 }}
          className="flex items-center gap-10 mb-8"
        >
          {[
            { value: "18", label: "Chapters" },
            { value: "700", label: "Shlokas" },
            { value: "∞", label: "Wisdom" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-lg font-display text-primary">{stat.value}</p>
              <p className="text-[9px] text-muted-foreground font-body uppercase tracking-[0.2em] mt-0.5">
                {stat.label}
              </p>
            </div>
          ))}
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-muted-foreground/40 font-body text-[10px] tracking-wide"
        >
          Radhe Radhe 🙏
        </motion.p>
      </div>
    </motion.section>
  );
};

export default HeroSection;
