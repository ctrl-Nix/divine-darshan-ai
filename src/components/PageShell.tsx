import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

const PageShell = ({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35 }}
    className="min-h-[100dvh] bg-fluid-gradient px-5 pt-6 pb-28"
  >
    <div className="max-w-2xl mx-auto">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-xs font-body text-muted-foreground hover:text-primary transition-colors mb-6"
      >
        <ArrowLeft size={14} /> Home
      </Link>
      <h1
        className="font-display text-3xl sm:text-4xl text-transparent bg-clip-text bg-gradient-to-r from-[hsl(var(--divine-gold))] via-primary to-[hsl(var(--saffron-glow))] mb-2"
        style={{ fontFamily: "'Cinzel', 'Playfair Display', serif" }}
      >
        {title}
      </h1>
      {subtitle && (
        <p className="text-muted-foreground font-body text-sm mb-8">{subtitle}</p>
      )}
      {children}
    </div>
  </motion.div>
);

export default PageShell;
