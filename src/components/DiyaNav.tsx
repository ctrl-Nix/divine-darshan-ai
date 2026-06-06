import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const DIYAS = [
  { to: "/darshan", label: "Daily Darshan" },
  { to: "/verse", label: "Verse of the Day" },
  { to: "/journal", label: "My Journal" },
  { to: "/japa", label: "Japa Counter" },
  { to: "/leela", label: "Leela Stories" },
];

const Diya = ({ delay = 0 }: { delay?: number }) => (
  <div className="relative w-10 h-12 flex flex-col items-center justify-end">
    {/* flame */}
    <div className="relative w-3 h-5 mb-0.5">
      <div
        className="absolute inset-0 rounded-full blur-md"
        style={{
          background:
            "radial-gradient(circle, hsl(var(--divine-gold)/0.7), transparent 70%)",
          animation: `diyaGlow 2s ease-in-out infinite`,
          animationDelay: `${delay}s`,
        }}
      />
      <svg viewBox="0 0 12 20" className="relative w-full h-full">
        <path
          d="M6 1c0 0-4 5-4 9.5C2 14 4 17 6 17s4-3 4-6.5C10 6 6 1 6 1z"
          fill="hsl(var(--divine-gold))"
          className="diya-flame"
          style={{ animationDelay: `${delay}s` }}
        />
        <path
          d="M6 6c0 0-2 3-2 5.5C4 13 5 14 6 14s2-1 2-2.5C8 9 6 6 6 6z"
          fill="hsl(var(--saffron-glow))"
          className="diya-flame-inner"
          style={{ animationDelay: `${delay}s` }}
        />
      </svg>
    </div>
    {/* clay bowl */}
    <svg viewBox="0 0 40 14" className="w-10 h-3.5">
      <defs>
        <linearGradient id={`bowl-${delay}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(28 60% 35%)" />
          <stop offset="100%" stopColor="hsl(20 70% 22%)" />
        </linearGradient>
      </defs>
      <path
        d="M2 2 Q20 16 38 2 Z"
        fill={`url(#bowl-${delay})`}
        stroke="hsl(var(--divine-gold)/0.5)"
        strokeWidth="0.5"
      />
    </svg>
  </div>
);

const DiyaNav = () => {
  return (
    <div className="w-full">
      <div className="flex flex-wrap items-end justify-center gap-3 sm:gap-5 px-2 py-4 rounded-2xl glass border-[hsl(var(--divine-gold)/0.25)]">
        {DIYAS.map((d, i) => (
          <motion.div
            key={d.to}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i }}
            whileHover={{ y: -3 }}
          >
            <Link
              to={d.to}
              className="group flex flex-col items-center gap-1.5 px-1 sm:px-2"
            >
              <Diya delay={i * 0.2} />
              <span className="font-display text-[10px] sm:text-[11px] tracking-wide text-foreground/70 group-hover:text-primary transition-colors text-center leading-tight max-w-[70px]">
                {d.label}
              </span>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default DiyaNav;
