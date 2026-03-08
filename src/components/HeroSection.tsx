import { motion } from "framer-motion";
import { MessageCircle, Sparkles, BookOpen, Heart, Phone } from "lucide-react";
import krishnaImg from "@/assets/krishna-hero.jpg";

const floatingIcons = [
  { icon: "🪷", x: "10%", y: "20%", delay: 0, duration: 7 },
  { icon: "🕉️", x: "85%", y: "15%", delay: 1.2, duration: 8 },
  { icon: "🦚", x: "75%", y: "75%", delay: 0.5, duration: 6 },
  { icon: "🪈", x: "15%", y: "80%", delay: 2, duration: 9 },
  { icon: "✨", x: "50%", y: "10%", delay: 0.8, duration: 5 },
];

const HeroSection = ({ onStartChat, onStartCall }: { onStartChat: () => void; onStartCall: () => void }) => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-cosmic">
      {/* Ambient glow effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/8 blur-[120px] glow-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-peacock/8 blur-[100px] glow-pulse" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-saffron/3 blur-[200px] glow-pulse" style={{ animationDelay: '3s' }} />
      </div>

      {/* Floating icons */}
      {floatingIcons.map((item, i) => (
        <motion.div
          key={i}
          className="absolute text-2xl md:text-3xl pointer-events-none opacity-20"
          style={{ left: item.x, top: item.y }}
          animate={{
            y: [0, -20, 0],
            rotate: [0, 10, -10, 0],
            opacity: [0.15, 0.3, 0.15],
          }}
          transition={{
            duration: item.duration,
            repeat: Infinity,
            delay: item.delay,
            ease: "easeInOut",
          }}
        >
          {item.icon}
        </motion.div>
      ))}

      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col items-center gap-10 lg:gap-14">
          {/* Krishna Image with rings */}
          <motion.div
            initial={{ opacity: 0, scale: 0.6, rotate: -5 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative float-gentle"
          >
            {/* Outer rotating ring */}
            <motion.div
              className="absolute -inset-4 rounded-full border border-primary/20"
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="absolute -inset-8 rounded-full border border-peacock/10"
              animate={{ rotate: -360 }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            />

            <div className="w-48 h-48 md:w-64 md:h-64 lg:w-72 lg:h-72 rounded-full overflow-hidden shadow-glow border-2 border-primary/40 relative">
              <img
                src={krishnaImg}
                alt="Lord Krishna - Divine Guide"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent" />
            </div>

            {/* Sparkle badge */}
            <motion.div
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-card border border-primary/30 rounded-full px-4 py-1.5 flex items-center gap-1.5 shadow-divine"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
            >
              <Sparkles size={14} className="text-primary" />
              <span className="text-xs font-body text-primary font-medium">AI Powered</span>
            </motion.div>
          </motion.div>

          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-center max-w-2xl"
          >
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-peacock font-body text-sm tracking-[0.3em] uppercase mb-3"
            >
              ॐ श्री कृष्णाय नमः
            </motion.p>

            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold mb-5 leading-tight">
              <span className="shimmer-text">Gita AI</span>
            </h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-foreground/80 font-body text-lg md:text-xl mb-3 leading-relaxed"
            >
              Your divine guide to life's toughest questions.
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="text-muted-foreground font-body text-base mb-10"
            >
              गीता का ज्ञान, आपकी भाषा में। Talk, type, or speak — Krishna's wisdom is here for you. 🙏
            </motion.p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 0 40px hsl(36 90% 55% / 0.4)" }}
                whileTap={{ scale: 0.95 }}
                onClick={onStartChat}
                className="group px-8 py-4 rounded-2xl bg-gradient-divine font-body font-semibold text-primary-foreground shadow-divine transition-all duration-500 flex items-center gap-3 justify-center"
              >
                <MessageCircle size={20} className="group-hover:rotate-12 transition-transform" />
                Start Conversation
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 0 30px hsl(120 40% 40% / 0.3)" }}
                whileTap={{ scale: 0.95 }}
                onClick={onStartCall}
                className="group px-8 py-4 rounded-2xl border-2 border-green-500/40 bg-green-500/10 font-body font-semibold text-green-400 hover:bg-green-500/20 transition-all duration-300 flex items-center gap-3 justify-center"
              >
                <Phone size={20} className="group-hover:animate-pulse" />
                🎙️ Call Gita Guide
              </motion.button>
            </div>
          </motion.div>

          {/* Feature Cards */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl w-full mt-4"
          >
            {[
              { icon: BookOpen, title: "700+ Shlokas", desc: "All 18 chapters of wisdom" },
              { icon: Heart, title: "Personal Guidance", desc: "Tailored to your problems" },
              { icon: Sparkles, title: "Voice Enabled", desc: "Speak in Hindi, get answers" },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                whileHover={{ y: -4, borderColor: "hsl(36 90% 55% / 0.4)" }}
                className="bg-card/60 backdrop-blur-sm border border-border rounded-2xl p-5 text-center transition-all duration-300 cursor-default"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.4 + i * 0.15 }}
              >
                <feature.icon size={24} className="text-primary mx-auto mb-2" />
                <p className="font-body font-semibold text-foreground text-sm">{feature.title}</p>
                <p className="font-body text-muted-foreground text-xs mt-1">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.8 }}
            className="flex gap-10 justify-center"
          >
            {[
              { num: "18", label: "Chapters" },
              { num: "700", label: "Shlokas" },
              { num: "∞", label: "Wisdom" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl md:text-3xl font-display font-bold text-primary">{stat.num}</p>
                <p className="text-xs text-muted-foreground font-body uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
