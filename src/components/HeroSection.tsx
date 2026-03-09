import { motion } from "framer-motion";
import { MessageCircle, Phone, ArrowRight } from "lucide-react";
import krishnaImg from "@/assets/krishna-mahabharat.png";

const HeroSection = ({
  onStartChat,
  onStartCall,
}: {
  onStartChat: () => void;
  onStartCall: () => void;
}) => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-cosmic">
      {/* Single ambient glow — restrained */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] rounded-full bg-primary/[0.04] blur-[120px] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center px-6 py-20 max-w-xl w-full">
        {/* Krishna avatar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="relative mb-10"
        >
          <div className="w-36 h-36 md:w-44 md:h-44 rounded-full overflow-hidden border border-primary/25 shadow-divine">
            <img
              src={krishnaImg}
              alt="Krishna — compassionate gaze"
              className="w-full h-full object-cover"
              loading="eager"
            />
          </div>

          {/* Subtle rotating ring */}
          <motion.div
            className="absolute -inset-3 rounded-full border border-primary/10"
            animate={{ rotate: 360 }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          />
        </motion.div>

        {/* Typography */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="text-center mb-12"
        >
          <p className="text-primary/70 font-body text-[11px] tracking-[0.35em] uppercase mb-4">
            ॐ श्री कृष्णाय नमः
          </p>

          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-normal mb-5 leading-[1.1]">
            <span className="shimmer-text">Gita AI</span>
          </h1>

          <p className="text-foreground/70 font-body text-base md:text-lg leading-relaxed max-w-md mx-auto mb-2">
            Verse-grounded guidance from the Bhagavad Gita, in Hindi or English.
          </p>
          <p className="text-muted-foreground font-body text-sm max-w-sm mx-auto">
            An AI messenger — not Lord Krishna — sharing His teachings with devotion.
          </p>
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto mb-16"
        >
          <button
            onClick={onStartChat}
            className="group flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-gradient-divine font-body text-sm font-semibold text-primary-foreground shadow-divine hover:shadow-[0_4px_32px_-4px_hsl(var(--primary)/0.35)] transition-all duration-300"
          >
            <MessageCircle size={17} />
            Start Conversation
            <ArrowRight size={15} className="opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
          </button>

          <button
            onClick={onStartCall}
            className="flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl border border-border bg-card text-foreground/90 font-body text-sm font-medium hover:border-primary/30 hover:bg-card/80 transition-all duration-300"
          >
            <Phone size={17} />
            Voice Call
          </button>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex items-center gap-8 md:gap-12"
        >
          {[
            { value: "18", label: "Chapters" },
            { value: "700", label: "Shlokas" },
            { value: "∞", label: "Wisdom" },
          ].map((stat, i) => (
            <div key={stat.label} className="text-center">
              <p className="text-xl md:text-2xl font-display text-primary">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground font-body uppercase tracking-[0.2em] mt-0.5">
                {stat.label}
              </p>
              {i < 2 && (
                <span className="hidden" /> // dividers handled by gap
              )}
            </div>
          ))}
        </motion.div>

        {/* Footer credit */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-16 text-muted-foreground/40 font-body text-[11px] tracking-wide"
        >
          Radhe Radhe 🙏
        </motion.p>
      </div>
    </section>
  );
};

export default HeroSection;
