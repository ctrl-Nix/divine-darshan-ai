import { useEffect, useState } from "react";
import PageShell from "@/components/PageShell";
import { Feather, Trash2 } from "lucide-react";

type Entry = { id: string; text: string; ts: number };
const KEY = "gita-journal-entries";

const Journal = () => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [text, setText] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setEntries(JSON.parse(raw));
    } catch {}
  }, []);

  const save = (next: Entry[]) => {
    setEntries(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  };

  const add = () => {
    if (!text.trim()) return;
    const next = [{ id: crypto.randomUUID(), text: text.trim(), ts: Date.now() }, ...entries];
    save(next);
    setText("");
  };

  const remove = (id: string) => save(entries.filter((e) => e.id !== id));

  return (
    <PageShell title="My prayers to Krishna" subtitle="A private space — only you can see this">
      <div className="rounded-3xl glass-strong border border-[hsl(var(--divine-gold)/0.35)] p-5 sm:p-6 mb-8">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Hey Krishna, today I felt..."
          className="w-full min-h-[140px] bg-transparent resize-none border border-[hsl(var(--divine-gold)/0.4)] rounded-2xl p-4 font-body text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-[hsl(var(--divine-gold)/0.7)] transition-colors"
        />
        <div className="flex justify-end mt-3">
          <button
            onClick={add}
            disabled={!text.trim()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-divine text-primary-foreground text-sm font-medium shadow-divine disabled:opacity-40"
          >
            <Feather size={14} /> Offer prayer
          </button>
        </div>
      </div>

      <h2 className="font-display text-lg text-foreground/80 mb-3">Past prayers</h2>
      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">No prayers yet. Begin with a single word.</p>
      ) : (
        <div className="space-y-3">
          {entries.map((e) => (
            <div
              key={e.id}
              className="rounded-2xl glass border border-[hsl(var(--divine-gold)/0.2)] p-4 group"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <p className="text-[10px] tracking-[0.25em] uppercase text-primary/55">
                  {new Date(e.ts).toLocaleString()}
                </p>
                <button
                  onClick={() => remove(e.id)}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition"
                  aria-label="Delete"
                >
                  <Trash2 size={13} />
                </button>
              </div>
              <p className="text-sm text-foreground/85 whitespace-pre-wrap leading-relaxed">{e.text}</p>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
};

export default Journal;
