import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, ChevronDown } from "lucide-react";

interface WisdomLogicProps {
  content: string;
}

// Extract chapter/verse references like "Ch 2, Verse 47" or "2.47" or "Chapter 2" patterns
const extractVerseRef = (text: string): string | null => {
  const patterns = [
    /(?:Ch(?:apter)?\.?\s*(\d+),?\s*(?:Verse|Shlok(?:a)?|श्लोक)\.?\s*(\d+))/i,
    /(?:BG|Gita)\s*(\d+)[.:](\d+)/i,
    /(\d+)[.:](\d+)/,
    /(?:अध्याय|Chapter)\s*(\d+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[2]
        ? `Ch ${match[1]}, Verse ${match[2]}`
        : `Chapter ${match[1]}`;
    }
  }
  return null;
};

// Extract a wisdom concept from the response
const extractWisdomConcept = (text: string): string | null => {
  const concepts: Record<string, string> = {
    "nishkama karma": "Nishkama Karma (Selfless Action) — performing duty without attachment to results",
    "karma yoga": "Karma Yoga — the path of selfless action as spiritual practice",
    "dharma": "Dharma (Righteous Duty) — aligning actions with one's true purpose",
    "sthitaprajna": "Sthitaprajna (Steady Wisdom) — maintaining equanimity in all situations",
    "bhakti": "Bhakti (Devotion) — surrendering to the divine with love and faith",
    "detachment": "Vairagya (Detachment) — freedom from attachment to outcomes",
    "yoga": "Yoga (Union) — connecting the individual self with the universal consciousness",
    "atman": "Atman (The Self) — the eternal, unchanging essence within",
    "equanimity": "Samatvam (Equanimity) — maintaining balance in joy and sorrow",
    "surrender": "Sharanagati (Surrender) — trusting the divine plan completely",
    "duty": "Svadharma — fulfilling one's own duty with dedication",
    "peace": "Shanti (Peace) — the inner stillness beyond worldly turbulence",
    "self-realization": "Atma-Jnana (Self-Knowledge) — understanding one's true nature",
    "selfless": "Nishkama Karma (Selfless Action) — doing good without seeking reward",
    "meditation": "Dhyana (Meditation) — focused contemplation for inner clarity",
    "wisdom": "Jnana (Wisdom) — spiritual knowledge that liberates the soul",
  };

  const lowerText = text.toLowerCase();
  for (const [key, description] of Object.entries(concepts)) {
    if (lowerText.includes(key)) {
      return description;
    }
  }
  return null;
};

const WisdomLogic = ({ content }: WisdomLogicProps) => {
  const [expanded, setExpanded] = useState(false);

  const verseRef = extractVerseRef(content);
  const wisdomConcept = extractWisdomConcept(content);

  // Don't render if no useful metadata found
  if (!verseRef && !wisdomConcept) return null;

  return (
    <div className="mt-2 space-y-1.5">
      {/* Verse reference seal */}
      {verseRef && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 20 }}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/8 border border-primary/15"
        >
          <BookOpen size={11} className="text-primary/70" />
          <span className="text-[10px] font-body font-semibold text-primary/80 tracking-wide uppercase">
            Ref: {verseRef}
          </span>
        </motion.div>
      )}

      {/* Wisdom Logic expandable */}
      {wisdomConcept && (
        <div>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1 text-[11px] font-body text-muted-foreground hover:text-foreground transition-colors duration-200 group"
          >
            <motion.div
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <ChevronDown size={12} />
            </motion.div>
            <span className="group-hover:text-primary transition-colors">
              View Wisdom Logic
            </span>
          </button>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 24 }}
                className="overflow-hidden"
              >
                <div className="mt-1.5 px-3 py-2.5 rounded-lg bg-secondary/50 border border-border/50">
                  <p className="text-[11px] font-body text-foreground/70 leading-[1.6]">
                    <span className="text-primary/80 font-medium">Wisdom basis:</span>{" "}
                    Based on the concept of{" "}
                    <span className="font-display italic text-foreground/90">
                      {wisdomConcept}
                    </span>
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default WisdomLogic;
