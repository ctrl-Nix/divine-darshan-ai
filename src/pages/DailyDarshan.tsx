import PageShell from "@/components/PageShell";
import krishnaImg from "@/assets/krishna-mahabharat.png";

const DARSHANS = [
  { src: krishnaImg, caption: "Murlidhar — the flute-bearer of Vrindavan" },
  { src: krishnaImg, caption: "Govinda — protector of cows and devotees" },
  { src: krishnaImg, caption: "Madhava — sweetness incarnate" },
  { src: krishnaImg, caption: "Yogeshwara — master of yoga" },
  { src: krishnaImg, caption: "Parthasarathi — charioteer of Arjuna" },
  { src: krishnaImg, caption: "Damodara — bound by love" },
  { src: krishnaImg, caption: "Gopala — the eternal cowherd" },
];

const DailyDarshan = () => {
  const day = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  const today = DARSHANS[day % DARSHANS.length];

  return (
    <PageShell title="Daily Darshan" subtitle="A new glimpse of Krishna every sunrise">
      <div className="rounded-3xl glass-strong border border-[hsl(var(--divine-gold)/0.3)] p-4 shadow-divine">
        <div className="relative rounded-2xl overflow-hidden aspect-square">
          <img
            src={today.src}
            alt={today.caption}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 ring-1 ring-inset ring-[hsl(var(--divine-gold)/0.4)] rounded-2xl pointer-events-none" />
        </div>
        <p className="mt-4 text-center font-display italic text-foreground/85">
          {today.caption}
        </p>
        <p className="mt-2 text-center text-[10px] tracking-[0.3em] uppercase text-primary/60">
          Hare Krishna 🙏
        </p>
      </div>
    </PageShell>
  );
};

export default DailyDarshan;
