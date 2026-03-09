import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, ArrowLeft, Globe } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import VoiceButton from "./VoiceButton";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type ChatLang = "en" | "hi";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gita-chat`;

const SUGGESTIONS: Record<ChatLang, string[]> = {
  en: [
    "I'm feeling overwhelmed by stress",
    "What is the purpose of my life?",
    "How do I handle anger?",
    "I'm confused about my career",
  ],
  hi: [
    "मुझे बहुत तनाव हो रहा है",
    "मेरे जीवन का उद्देश्य क्या है?",
    "गुस्सा कैसे संभालूं?",
    "करियर में बहुत भ्रम है",
  ],
};

const WELCOME: Record<ChatLang, string> = {
  en: `🙏 **Jai Shri Krishna**\n\nI'll share guidance from the Bhagavad Gita — verse by verse, for whatever weighs on your heart.\n\nTell me what's on your mind. **Radhe Radhe 🙏**`,
  hi: `🙏 **जय श्री कृष्ण**\n\nमैं भगवद् गीता से — श्लोक दर श्लोक — आपके मन की हर चिंता का मार्गदर्शन दूँगा।\n\nबताइए, क्या चल रहा है मन में? **राधे राधे 🙏**`,
};

async function streamChat({
  messages,
  language,
  onDelta,
  onDone,
}: {
  messages: { role: string; content: string }[];
  language: ChatLang;
  onDelta: (text: string) => void;
  onDone: () => void;
}) {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages, language }),
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
      if (jsonStr === "[DONE]") {
        streamDone = true;
        break;
      }

      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch {
        buffer = `${line}\n${buffer}`;
        break;
      }
    }
  }

  onDone();
}

const ChatInterface = ({ onBack }: { onBack: () => void }) => {
  const [chatLang, setChatLang] = useState<ChatLang>("en");
  const [messages, setMessages] = useState<Message[]>([
    { id: "welcome", role: "assistant", content: WELCOME.en },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const switchLanguage = useCallback(
    (next: ChatLang) => {
      if (isLoading) return;
      setChatLang(next);
      setMessages([{ id: "welcome", role: "assistant", content: WELCOME[next] }]);
      setInput("");
      setShowSuggestions(true);
      inputRef.current?.focus();
    },
    [isLoading],
  );

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      const userMsg: Message = {
        id: Date.now().toString(),
        role: "user",
        content: text.trim(),
      };

      const newMessages = [...messages, userMsg];
      setMessages(newMessages);
      setInput("");
      setIsLoading(true);
      setShowSuggestions(false);

      let assistantSoFar = "";

      const upsertAssistant = (chunk: string) => {
        assistantSoFar += chunk;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant" && last.id === "streaming") {
            return prev.map((m, i) =>
              i === prev.length - 1 ? { ...m, content: assistantSoFar } : m,
            );
          }
          return [...prev, { id: "streaming", role: "assistant", content: assistantSoFar }];
        });
      };

      try {
        await streamChat({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          language: chatLang,
          onDelta: upsertAssistant,
          onDone: () => {
            setIsLoading(false);
            setMessages((prev) =>
              prev.map((m) => (m.id === "streaming" ? { ...m, id: Date.now().toString() } : m)),
            );
          },
        });
      } catch (e: any) {
        console.error(e);
        toast.error(
          chatLang === "hi"
            ? e.message || "कुछ गलत हुआ, कृपया फिर प्रयास करें"
            : e.message || "Something went wrong, please try again",
        );
        setIsLoading(false);
      }
    },
    [chatLang, isLoading, messages],
  );

  const handleSend = useCallback(() => sendMessage(input), [input, sendMessage]);

  const handleVoiceResult = useCallback(
    (text: string) => {
      setInput(text);
      sendMessage(text);
    },
    [sendMessage],
  );

  const voiceLang = chatLang === "hi" ? "hi-IN" : "en-IN";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col h-screen bg-background"
    >
      {/* Header */}
      <header className="flex items-center gap-3 px-4 md:px-6 py-3 border-b border-border bg-card/60 backdrop-blur-xl">
        <button
          onClick={onBack}
          className="p-2 -ml-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="w-9 h-9 rounded-full bg-gradient-divine flex items-center justify-center shadow-divine flex-shrink-0">
          <span className="text-base">🙏</span>
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="font-display text-base text-foreground leading-tight">Gita Guide</h2>
          <p className="text-[11px] text-muted-foreground font-body truncate">
            {chatLang === "hi" ? "गीता से मार्गदर्शन" : "Guidance from the Gita"}
          </p>
        </div>

        {/* Language toggle */}
        <div className="flex items-center gap-0.5 rounded-lg border border-border bg-muted p-0.5">
          {(["en", "hi"] as const).map((lang) => (
            <button
              key={lang}
              onClick={() => switchLanguage(lang)}
              disabled={isLoading}
              className={`px-2.5 py-1 rounded-md text-[11px] font-body font-medium transition-all duration-200 ${
                chatLang === lang
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {lang === "en" ? "EN" : "हिं"}
            </button>
          ))}
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-5 space-y-4">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-full bg-gradient-divine flex items-center justify-center mr-2.5 mt-1 flex-shrink-0">
                  <span className="text-xs">🙏</span>
                </div>
              )}

              <div
                className={`max-w-[82%] md:max-w-[65%] px-4 py-3 font-body text-[14px] leading-[1.7] ${
                  msg.role === "user"
                    ? "bg-primary/15 text-foreground rounded-2xl rounded-br-lg border border-primary/15"
                    : "bg-card text-card-foreground rounded-2xl rounded-bl-lg border border-border"
                }`}
              >
                <ReactMarkdown
                  components={{
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-2 border-primary/40 pl-3 my-2 italic text-foreground/80 text-[13px]">
                        {children}
                      </blockquote>
                    ),
                    strong: ({ children }) => (
                      <strong className="text-primary font-semibold">{children}</strong>
                    ),
                    p: ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
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
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap gap-2 justify-center pt-3"
          >
            {SUGGESTIONS[chatLang].map((s) => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                className="px-3.5 py-2 rounded-xl border border-border bg-card text-[13px] font-body text-foreground/70 hover:border-primary/30 hover:text-foreground hover:bg-card/80 transition-all duration-200"
              >
                {s}
              </button>
            ))}
          </motion.div>
        )}

        {/* Typing indicator */}
        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-divine flex items-center justify-center mr-2.5 flex-shrink-0">
              <span className="text-xs">🙏</span>
            </div>
            <div className="bg-card border border-border rounded-2xl rounded-bl-lg px-4 py-3 flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-primary/50 typing-dot"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="px-4 md:px-6 py-3 border-t border-border bg-card/40 backdrop-blur-xl">
        <div className="flex items-center gap-2 max-w-3xl mx-auto">
          <VoiceButton onResult={handleVoiceResult} languageCode={voiceLang} />

          <div className="flex-1 relative">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={chatLang === "hi" ? "अपनी बात लिखें..." : "Share what's on your mind..."}
              className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 font-body text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/40 transition-all"
            />
          </div>

          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="p-2.5 rounded-xl bg-gradient-divine text-primary-foreground shadow-divine disabled:opacity-30 disabled:shadow-none transition-all duration-200"
          >
            <Send size={17} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ChatInterface;
