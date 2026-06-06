import PageShell from "@/components/PageShell";

const STORIES = [
  {
    title: "The Butter Thief of Gokul",
    body: "In the lanes of Gokul, little Kanha would tiptoe into homes with his band of friends, climb upon each other's shoulders, and reach the hanging matkas of fresh butter. The gopis pretended to scold him — but truly, they hid the butter higher only so He would come again. For when Krishna steals butter, He is really stealing hearts.",
  },
  {
    title: "Lifting Govardhan",
    body: "When proud Indra unleashed a storm upon Vrindavan, the young Krishna lifted the mighty Govardhan hill on the tip of His little finger. For seven days and nights, the villagers, cows, and children sheltered beneath. He smiled gently — for the Lord asks no offering greater than our trust.",
  },
  {
    title: "Draupadi's Endless Saree",
    body: "In the court of the Kauravas, when Draupadi cried out 'Govinda!', Krishna in distant Dwarka heard her single tear. As Dushasana pulled, the cloth grew without end — yards upon yards of mercy. He did not need to be present to protect; remembering Him was enough.",
  },
  {
    title: "Sudama's Handful of Poha",
    body: "The poor brahmin Sudama walked many days to Dwarka with only a small bundle of beaten rice. Krishna, the king of kings, ran barefoot to embrace His childhood friend, ate the humble poha with tears of love, and silently filled Sudama's empty hut with palaces. The Lord measures only the love behind the gift.",
  },
  {
    title: "The Raas under the Moon",
    body: "On the full-moon night of Sharad, Krishna played His flute by the Yamuna. The gopis left their homes, their chores, their reputations — and danced. Each one felt Krishna danced with her alone. Such is divine love: it multiplies without dividing.",
  },
  {
    title: "Friend on the Chariot",
    body: "When Arjuna's hands trembled on the battlefield of Kurukshetra, Krishna — who could have crushed armies with a glance — chose instead to hold the reins of His friend's chariot. The Lord does not always remove the battle; sometimes He simply steers you through it.",
  },
];

const LeelaStories = () => (
  <PageShell title="Leela Stories" subtitle="The endless play of the Lord">
    <div className="space-y-5">
      {STORIES.map((s, i) => (
        <article
          key={i}
          className="rounded-3xl glass-strong border border-[hsl(var(--divine-gold)/0.3)] p-6 sm:p-7 hover:border-[hsl(var(--divine-gold)/0.55)] transition-colors"
        >
          <p className="text-[10px] tracking-[0.3em] uppercase text-primary/55 mb-2">
            Leela {String(i + 1).padStart(2, "0")}
          </p>
          <h2
            className="font-display text-xl sm:text-2xl text-transparent bg-clip-text bg-gradient-to-r from-[hsl(var(--divine-gold))] to-primary mb-3"
            style={{ fontFamily: "'Cinzel', 'Playfair Display', serif" }}
          >
            {s.title}
          </h2>
          <p className="font-body text-[15px] leading-[1.75] text-foreground/85">
            {s.body}
          </p>
        </article>
      ))}
    </div>
  </PageShell>
);

export default LeelaStories;
