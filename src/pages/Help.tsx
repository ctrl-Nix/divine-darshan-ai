import { motion } from "framer-motion";
import { ArrowLeft, MessageCircle, Phone, Globe, Flame, BookOpen, GraduationCap, Heart, User, Accessibility, Moon, Type, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ParticleBackground from "@/components/ParticleBackground";

const spring = { type: "spring" as const, stiffness: 200, damping: 24 };

const SECTIONS = [
  {
    icon: GraduationCap,
    title: "Character Selection",
    description: "Choose your path on the home screen — Student, Seeker, or Elder. Each reveals a different Verse of the Day tailored to your journey.",
    details: [
      "Student — Focus & discipline verses for learners",
      "Seeker — Purpose & detachment wisdom for the curious",
      "Elder — Eternal truths about the soul for the wise",
    ],
  },
  {
    icon: Flame,
    title: "The Diya (🪔) Lamp",
    description: "The glowing lamp icon in the chat header is a gentle reminder — tap it anytime.",
    details: [
      "It plays a singing bowl sound for mindfulness",
      "Shows a disclaimer: this AI points to the Gita's truths, but is not a replacement for your Guru or elders",
      "Hover or tap to reveal the guidance tooltip",
    ],
  },
  {
    icon: MessageCircle,
    title: "Text Chat",
    description: "Start a conversation with Krishna AI by tapping 'Start Conversation' or selecting a mood chip.",
    details: [
      "Type your question or concern in the input field",
      "AI responds with relevant Bhagavad Gita wisdom",
      "Shloka references appear as expandable verse cards",
      "Use the microphone button 🎙️ to speak instead of typing",
    ],
  },
  {
    icon: Phone,
    title: "Voice Call",
    description: "Tap 'Voice Call' for a hands-free, spoken conversation with Krishna AI.",
    details: [
      "Choose Hindi or English before starting",
      "Speak naturally — your voice is transcribed automatically",
      "AI responds with both text and spoken audio",
      "Silence detection auto-stops recording when you pause",
    ],
  },
  {
    icon: Globe,
    title: "Language Toggle (EN / हि)",
    description: "Switch between English and Hindi anytime during chat or voice call.",
    details: [
      "Tap the language toggle in the chat header",
      "Suggestions, welcome message, and AI responses adapt to your choice",
      "Voice input language also switches accordingly",
    ],
  },
  {
    icon: BookOpen,
    title: "Mood Chips",
    description: "On the home screen, select how you're feeling — Anxious, Confused, Heartbroken, Angry, Seeking Peace, or Lost Purpose.",
    details: [
      "Tapping a mood chip starts a conversation themed around that emotion",
      "Krishna AI tailors its opening response to your state of mind",
    ],
  },
  {
    icon: Accessibility,
    title: "Accessibility Controls",
    description: "Three buttons in the top-right corner of the home screen let you customize your experience.",
    details: [
      "🔤 Text Size — cycle through Normal, Large, and Extra Large",
      "👁️ High Contrast — toggle enhanced contrast mode",
      "🌙 Theme — switch between Light and Dark mode",
    ],
  },
];

const Help = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background relative">
      <ParticleBackground />

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring}
        className="sticky top-0 z-30 glass-strong border-b border-border/40"
      >
        <div className="max-w-2xl mx-auto px-5 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="p-2 rounded-xl hover:bg-primary/10 transition-colors"
            aria-label="Back to home"
          >
            <ArrowLeft className="w-5 h-5 text-foreground/80" />
          </button>
          <div>
            <h1 className="font-display text-lg font-semibold text-foreground tracking-tight">
              How to Use Gita AI
            </h1>
            <p className="text-[11px] text-muted-foreground font-body">
              Your guide to every feature
            </p>
          </div>
        </div>
      </motion.header>

      {/* Content */}
      <main className="relative z-10 max-w-2xl mx-auto px-5 py-8 space-y-5">
        {/* Intro */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.1 }}
          className="glass rounded-2xl border border-primary/20 p-5"
        >
          <p className="text-sm font-body text-foreground/85 leading-relaxed">
            <span className="text-primary font-semibold">Gita AI</span> is your
            personal companion for exploring the timeless wisdom of the Bhagavad
            Gita. Whether you chat, call, or simply reflect — every feature is
            designed to bring you closer to clarity and peace.
          </p>
        </motion.div>

        {/* Feature sections */}
        {SECTIONS.map((section, i) => {
          const Icon = section.icon;
          return (
            <motion.article
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: 0.15 + i * 0.06 }}
              className="glass rounded-2xl border border-border/50 overflow-hidden"
            >
              {/* Section header */}
              <div className="flex items-start gap-3 p-5 pb-3">
                <div className="shrink-0 w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Icon className="w-4.5 h-4.5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-display text-base font-semibold text-foreground tracking-tight">
                    {section.title}
                  </h2>
                  <p className="text-[13px] font-body text-muted-foreground leading-relaxed mt-1">
                    {section.description}
                  </p>
                </div>
              </div>

              {/* Details */}
              <ul className="px-5 pb-5 space-y-2">
                {section.details.map((detail, j) => (
                  <li
                    key={j}
                    className="flex items-start gap-2 text-[12.5px] font-body text-foreground/75 leading-relaxed"
                  >
                    <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/50" />
                    {detail}
                  </li>
                ))}
              </ul>
            </motion.article>
          );
        })}

        {/* Footer note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center py-6"
        >
          <p className="text-[11px] text-muted-foreground font-body">
            🪔 Like a lamp shows the path — this AI points to the Gita's truths.
          </p>
          <p className="text-[10px] text-muted-foreground/60 font-body mt-1">
            Built with devotion by Shreyanshi Singh
          </p>
        </motion.div>
      </main>
    </div>
  );
};

export default Help;
