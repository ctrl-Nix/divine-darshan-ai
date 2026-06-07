import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageShell from "@/components/PageShell";
import { ChevronRight } from "lucide-react";

const DARSHANS = [
  {
    src: "https://upload.wikimedia.org/wikipedia/commons/7/79/Radha_Krishna_at_Iskcon_Vrindavan.jpg",
    name: "Radha Krishna",
    caption: "The divine lovers of Vrindavan",
  },
  {
    src: "https://upload.wikimedia.org/wikipedia/commons/2/2e/Indian_-_Krishna_as_the_Cowherder_with_the_Bamboo_Flute_-_Walters_543005.jpg",
    name: "Murlidhar",
    caption: "The flute-bearer whose music enchants the world",
  },
  {
    src: "https://upload.wikimedia.org/wikipedia/commons/1/17/Vrundavan_Radha_Krishna_03.JPG",
    name: "Vrindavaneshwar",
    caption: "Lord of the sacred groves of Vrindavan",
  },
  {
    src: "https://upload.wikimedia.org/wikipedia/commons/b/b6/A_15th_Century_Hindu_Art%2C_Hindu_deity_Krishna%2C_Asian_Art_Museum_of_San_Francisco.jpg",
    name: "Dwarkadheesh",
    caption: "The king of Dwarka, protector of his people",
  },
  {
    src: "https://upload.wikimedia.org/wikipedia/commons/b/b5/UDUPI_SRI_KRISHNA.jpg",
    name: "Udupi Krishna",
    caption: "The child Krishna worshipped in Udupi",
  },
  {
    src: "https://upload.wikimedia.org/wikipedia/commons/1/14/Sri_Krishna_Temple%2C_ISKCON%2C_Mayapur.jpg",
    name: "Mayapur Chandra",
    caption: "The golden moon of Mayapur",
  },
  {
    src: "https://upload.wikimedia.org/wikipedia/commons/d/dd/Krishna_temple_at_Hampi.jpg",
    name: "Hampi Krishna",
    caption: "The eternal presence among ancient stones",
  },
  {
    src: "https://upload.wikimedia.org/wikipedia/commons/3/3e/009232022_Ambalaphuzha_Shri_Krishna_Swamy_Temple_Kerala_08.jpg",
    name: "Ambalappuzha Krishna",
    caption: "The butter-thief of Kerala temples",
  },
  {
    src: "https://upload.wikimedia.org/wikipedia/commons/a/a0/Maker_unknown%2C_India_-_Krishna_and_Radha_-_Google_Art_Project.jpg",
    name: "Rasraj",
    caption: "The sovereign of the Rasa dance",
  },
  {
    src: "https://upload.wikimedia.org/wikipedia/commons/4/47/Krishna_playing_bansuri%2C_flute.jpg",
    name: "Bansidhar",
    caption: "He whose flute calls every soul home",
  },
  {
    src: "https://upload.wikimedia.org/wikipedia/commons/d/dc/Shrinathji_Nathdwara_Pushtimarg_Krishna_jouant_de_la_fl%C3%BBte_%28Mus%C3%A9e_Guimet%2C_Paris%29.jpg",
    name: "Shrinathji",
    caption: "The lifted mountain, lifter of Govardhan",
  },
  {
    src: "https://upload.wikimedia.org/wikipedia/commons/9/99/12th-century_stone_carving_showing_Vishnu_avatar_Krishna_playing_flute_at_Shaivism_Hindu_temple_Hoysaleswara_arts_Halebidu_Karnataka_India.jpg",
    name: "Hoysaleswara Krishna",
    caption: "Carved in stone, living in devotion for centuries",
  },
];

function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

const DailyDarshan = () => {
  const dayIndex = getDayOfYear(new Date()) % DARSHANS.length;
  const [index, setIndex] = useState(dayIndex);
  const [isAnimating, setIsAnimating] = useState(false);

  const darshan = DARSHANS[index];

  const goToNext = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setIndex((prev) => (prev + 1) % DARSHANS.length);
  }, [isAnimating]);

  return (
    <PageShell title="Daily Darshan" subtitle="A new glimpse of Krishna every sunrise">
      <div className="rounded-3xl glass-strong border border-[hsl(var(--divine-gold)/0.3)] p-4 shadow-divine">
        <div className="relative rounded-2xl overflow-hidden aspect-square bg-muted">
          <AnimatePresence mode="wait" onExitComplete={() => setIsAnimating(false)}>
            <motion.img
              key={index}
              src={darshan.src}
              alt={darshan.name}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="absolute inset-0 w-full h-full object-cover"
              onAnimationComplete={() => setIsAnimating(false)}
            />
          </AnimatePresence>
          <div className="absolute inset-0 ring-1 ring-inset ring-[hsl(var(--divine-gold)/0.4)] rounded-2xl pointer-events-none" />
        </div>

        <p className="mt-4 text-center font-display italic text-foreground/85 text-sm sm:text-base">
          Darshan of the Day — {darshan.name}
        </p>
        <p className="mt-1 text-center text-xs text-muted-foreground">
          {darshan.caption}
        </p>

        <button
          onClick={goToNext}
          disabled={isAnimating}
          className="mt-5 mx-auto flex items-center gap-2 px-5 py-2 rounded-full border border-[hsl(var(--divine-gold)/0.4)] text-[hsl(var(--divine-gold))] hover:bg-[hsl(var(--divine-gold)/0.1)] transition-all duration-300 text-sm disabled:opacity-40"
        >
          Next Darshan <ChevronRight size={14} />
        </button>

        <p className="mt-3 text-center text-[10px] tracking-[0.3em] uppercase text-primary/60">
          Hare Krishna 🙏
        </p>
      </div>
    </PageShell>
  );
};

export default DailyDarshan;
