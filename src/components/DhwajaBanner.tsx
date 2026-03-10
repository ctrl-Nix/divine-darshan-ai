import { motion } from "framer-motion";
import { ScrollText } from "lucide-react";

const DhwajaBanner = () => {
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      transition={{
        height: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
        opacity: { duration: 0.6, delay: 0.3 },
      }}
      className="overflow-hidden sticky top-0 z-20"
    >
      <div className="mx-3 mt-3 mb-1 rounded-xl parchment-bg border border-primary/20 overflow-hidden">
        {/* Gold accent line */}
        <div className="h-[2px] bg-gradient-divine" />

        <div className="px-4 py-3 flex gap-3 items-start">
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 18, delay: 0.5 }}
            className="mt-0.5 shrink-0"
          >
            <ScrollText size={16} className="text-primary/70" />
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="text-[12px] leading-[1.7] font-body text-foreground/70 italic"
          >
            <span className="text-foreground/90 font-display not-italic font-semibold text-[13px]">
              "
            </span>
            I am a reflection of the Gita's wisdom, woven with modern code.
            I am a{" "}
            <span className="text-primary font-medium not-italic">Vidyarthi</span>{" "}
            (Student) of the Shlokas, not the Speaker of them. Use my words as a map,
            but let your own{" "}
            <span className="text-primary font-medium not-italic">Viveka</span>{" "}
            (conscience) be the compass.
            <span className="text-foreground/90 font-display not-italic font-semibold text-[13px]">
              "
            </span>
          </motion.p>
        </div>
      </div>
    </motion.div>
  );
};

export default DhwajaBanner;
