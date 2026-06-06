import { useEffect, useState, useCallback } from "react";
import PageShell from "@/components/PageShell";
import { RotateCcw } from "lucide-react";

const KEY = "gita-japa-state";
const todayKey = () => new Date().toISOString().slice(0, 10);

type State = { date: string; count: number; rounds: number };

const playBell = () => {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.7);
    setTimeout(() => ctx.close(), 900);
  } catch {}
};

const JapaCounter = () => {
  const [state, setState] = useState<State>({ date: todayKey(), count: 0, rounds: 0 });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed: State = JSON.parse(raw);
        if (parsed.date === todayKey()) {
          setState(parsed);
        } else {
          setState({ date: todayKey(), count: 0, rounds: 0 });
        }
      }
    } catch {}
  }, []);

  const persist = (s: State) => {
    setState(s);
    localStorage.setItem(KEY, JSON.stringify(s));
  };

  const tap = useCallback(() => {
    playBell();
    if (navigator.vibrate) navigator.vibrate(15);
    setState((prev) => {
      const next = prev.count + 1;
      let count = next;
      let rounds = prev.rounds;
      if (next >= 108) {
        count = 0;
        rounds = prev.rounds + 1;
      }
      const s: State = { date: todayKey(), count, rounds };
      localStorage.setItem(KEY, JSON.stringify(s));
      return s;
    });
  }, []);

  const reset = () => persist({ date: todayKey(), count: 0, rounds: 0 });

  const pct = (state.count / 108) * 100;
  const cinzel = { fontFamily: "'Cinzel', 'Playfair Display', serif" };

  return (
    <PageShell title="Japa Counter" subtitle="One name. One breath. One bead.">
      <div className="rounded-3xl glass-strong border border-[hsl(var(--divine-gold)/0.35)] p-6 sm:p-10 text-center">
        <p className="text-[10px] tracking-[0.3em] uppercase text-primary/60 mb-2">
          Today's count
        </p>
        <p
          className="font-display font-bold text-7xl sm:text-8xl text-transparent bg-clip-text bg-gradient-to-b from-[hsl(var(--divine-gold))] to-primary leading-none mb-3"
          style={cinzel}
        >
          {state.count}
        </p>
        <p className="text-sm text-muted-foreground mb-6" style={cinzel}>
          {state.count} / 108
        </p>

        <div className="h-1.5 rounded-full bg-secondary overflow-hidden mb-8">
          <div
            className="h-full bg-gradient-to-r from-primary to-[hsl(var(--divine-gold))] transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>

        <button
          onClick={tap}
          className="relative w-40 h-40 sm:w-48 sm:h-48 rounded-full mx-auto mb-8 active:scale-95 transition-transform"
          style={{
            background:
              "radial-gradient(circle at 30% 30%, hsl(var(--saffron-glow)), hsl(var(--divine-gold)) 50%, hsl(28 70% 35%))",
            boxShadow:
              "0 0 60px hsl(var(--divine-gold)/0.4), inset 0 -8px 20px hsl(0 0% 0%/0.3), inset 0 8px 20px hsl(var(--saffron-glow)/0.4)",
          }}
          aria-label="Tap to count"
        >
          <span
            className="font-display text-xl text-primary-foreground/95 drop-shadow"
            style={cinzel}
          >
            ॐ
          </span>
        </button>

        <div className="flex items-center justify-between gap-4 max-w-xs mx-auto">
          <div className="flex-1 rounded-2xl glass p-3">
            <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-1">
              Rounds today
            </p>
            <p
              className="font-display text-2xl text-[hsl(var(--divine-gold))]"
              style={cinzel}
            >
              {state.rounds}
            </p>
          </div>
          <button
            onClick={reset}
            className="p-3 rounded-full glass hover:text-destructive transition"
            aria-label="Reset"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>
    </PageShell>
  );
};

export default JapaCounter;
