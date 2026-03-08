import { motion } from "framer-motion";
import krishnaImg from "@/assets/krishna-hero.jpg";

const HeroSection = ({ onStartChat }: { onStartChat: () => void }) => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-cosmic">
      {/* Ambient glow effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-[120px] glow-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-peacock/5 blur-[100px] glow-pulse" style={{ animationDelay: '1.5s' }} />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          {/* Krishna Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="relative float-gentle"
          >
            <div className="w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 rounded-full overflow-hidden shadow-glow border-2 border-primary/30">
              <img
                src={krishnaImg}
                alt="Lord Krishna - Divine Guide"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping" style={{ animationDuration: '3s' }} />
          </motion.div>

          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-center lg:text-left max-w-xl"
          >
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-peacock font-body text-sm md:text-base tracking-[0.3em] uppercase mb-4"
            >
              ॐ श्री कृष्णाय नमः
            </motion.p>

            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              <span className="shimmer-text">Gita AI</span>
            </h1>

            <p className="text-foreground/80 font-body text-lg md:text-xl mb-4 leading-relaxed">
              कृष्ण हर किसी के लिए हैं। अपनी समस्या बताइए, गीता में हर समाधान है।
            </p>

            <p className="text-muted-foreground font-body text-base mb-8">
              Share your worries with Krishna. The Bhagavad Gita holds answers to every problem in life.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onStartChat}
                className="px-8 py-4 rounded-xl bg-gradient-divine font-body font-semibold text-primary-foreground shadow-divine hover:shadow-glow transition-shadow duration-500"
              >
                🙏 कृष्ण से बात करें
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onStartChat}
                className="px-8 py-4 rounded-xl border border-primary/30 font-body font-medium text-primary hover:bg-primary/10 transition-colors duration-300"
              >
                Talk to Krishna
              </motion.button>
            </div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="flex gap-8 mt-12 justify-center lg:justify-start"
            >
              {[
                { num: "18", label: "अध्याय" },
                { num: "700", label: "श्लोक" },
                { num: "∞", label: "ज्ञान" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-2xl md:text-3xl font-display font-bold text-primary">{stat.num}</p>
                  <p className="text-xs text-muted-foreground font-body">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
