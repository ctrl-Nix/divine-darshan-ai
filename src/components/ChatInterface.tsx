import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, ArrowLeft, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import VoiceButton from "./VoiceButton";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gita-chat`;

async function streamChat({
  messages,
  onDelta,
  onDone,
}: {
  messages: { role: string; content: string }[];
  onDelta: (text: string) => void;
  onDone: () => void;
}) {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error || `Request failed: ${resp.status}`);
  }

  if (!resp.body) throw new Error("No response body");

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let streamDone = false;

  while (!streamDone) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let newlineIdx: number;
    while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
      let line = buffer.slice(0, newlineIdx);
      buffer = buffer.slice(newlineIdx + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;
      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") { streamDone = true; break; }
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch {
        buffer = line + "\n" + buffer;
        break;
      }
    }
  }
  onDone();
}

const SUGGESTIONS = [
  "I'm feeling overwhelmed by stress",
  "What is the purpose of life?",
  "I'm feeling lost in my career",
  "How do I control my anger?",
];

const ChatInterface = ({ onBack }: { onBack: () => void }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "🙏 **Jai Shri Krishna!** I am your Gita Guide — crafted by a devoted follower of Lord Krishna.\n\nWhatever troubles your heart — stress, fear, anger, confusion, or any question about life — **the Gita holds every answer.**\n\nType your question, speak it, or try the suggestions below! 🙏",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);
    setShowSuggestions(false);

    let assistantSoFar = "";
    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      const content = assistantSoFar;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && last.id === "streaming") {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content } : m);
        }
        return [...prev, { id: "streaming", role: "assistant", content }];
      });
    };

    try {
      await streamChat({
        messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        onDelta: upsertAssistant,
        onDone: () => {
          setIsLoading(false);
          setMessages((prev) =>
            prev.map((m) => m.id === "streaming" ? { ...m, id: Date.now().toString() } : m)
          );
        },
      });
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "कुछ गलत हो गया, पुनः प्रयास करें");
      setIsLoading(false);
    }
  }, [isLoading, messages]);

  const handleSend = useCallback(() => sendMessage(input), [input, sendMessage]);

  const handleVoiceResult = useCallback((text: string) => {
    setInput(text);
    // Auto-send after voice input
    sendMessage(text);
  }, [sendMessage]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="flex flex-col h-screen bg-background"
    >
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-border bg-card/50 backdrop-blur-lg">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={20} />
        </button>
        <motion.div
          className="w-10 h-10 rounded-full bg-gradient-divine flex items-center justify-center shadow-divine"
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <Sparkles size={18} className="text-primary-foreground" />
        </motion.div>
        <div className="flex-1">
          <h2 className="font-display font-semibold text-foreground text-lg">Gita Guide</h2>
          <p className="text-xs text-peacock font-body">Powered by Gita Wisdom • Always Available</p>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-peacock animate-pulse" />
          <span className="text-xs text-muted-foreground font-body">Online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 space-y-5">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-gradient-divine flex items-center justify-center mr-3 mt-1 flex-shrink-0 shadow-divine">
                  <span className="text-sm">🙏</span>
                </div>
              )}
              <div
                className={`max-w-[80%] md:max-w-[65%] px-5 py-4 rounded-2xl font-body text-sm md:text-base leading-relaxed ${
                  msg.role === "user"
                    ? "bg-primary/20 text-foreground rounded-br-md border border-primary/20"
                    : "bg-card text-card-foreground rounded-bl-md border border-border"
                }`}
              >
                <ReactMarkdown
                  components={{
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-2 border-primary/50 pl-4 my-3 italic text-primary/90">
                        {children}
                      </blockquote>
                    ),
                    strong: ({ children }) => (
                      <strong className="text-primary font-semibold">{children}</strong>
                    ),
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Suggestions */}
        {showSuggestions && messages.length === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap gap-2 justify-center pt-4"
          >
            {SUGGESTIONS.map((s) => (
              <motion.button
                key={s}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => sendMessage(s)}
                className="px-4 py-2 rounded-xl border border-primary/20 bg-card/50 text-sm font-body text-foreground/80 hover:border-primary/40 hover:bg-primary/5 transition-all"
              >
                {s}
              </motion.button>
            ))}
          </motion.div>
        )}

        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="w-8 h-8 rounded-full bg-gradient-divine flex items-center justify-center mr-3 flex-shrink-0">
              <span className="text-sm">🙏</span>
            </div>
            <div className="bg-card border border-border rounded-2xl rounded-bl-md px-5 py-4 flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 md:px-6 py-4 border-t border-border bg-card/30 backdrop-blur-lg">
        <div className="flex items-center gap-3 max-w-3xl mx-auto">
          <VoiceButton onResult={handleVoiceResult} />

          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask anything... कुछ भी पूछें..."
            className="flex-1 bg-secondary border border-border rounded-xl px-5 py-3 font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
          />

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="p-3 rounded-xl bg-gradient-divine text-primary-foreground shadow-divine disabled:opacity-40 disabled:shadow-none transition-all"
          >
            <Send size={20} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default ChatInterface;
