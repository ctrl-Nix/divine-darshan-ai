import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, ArrowLeft, Languages } from "lucide-react";
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
    "What is the purpose of my life right now?",
    "How do I handle anger at home?",
    "I'm confused in career decisions",
  ],
  hi: [
    "मुझे बहुत तनाव हो रहा है",
    "मेरे जीवन का उद्देश्य क्या है?",
    "घर में गुस्सा कैसे संभालूं?",
    "करियर में बहुत भ्रम है",
  ],
};

const WELCOME: Record<ChatLang, string> = {
  en: `🙏 **Jai Shri Krishna**\n\nYou'll receive guidance directly from Bhagavad Gita wisdom.\nI am not Lord Krishna — I am an AI messenger created by His devotee, sharing His teachings within my limits for those who can't read Gita right now.\n\nTell me your concern in one line, dear one. **Radhe Radhe 🙏**`,
  hi: `🙏 **जय श्री कृष्ण**\n\nआपको मार्गदर्शन सीधे भगवद् गीता के ज्ञान से मिलेगा।\nमैं भगवान कृष्ण नहीं हूँ — मैं उनके एक भक्त द्वारा बनाया गया AI संदेशवाहक हूँ, और अपनी सीमाओं में उनकी शिक्षा आप तक पहुँचाता हूँ, खासकर जब आप अभी गीता नहीं पढ़ पा रहे हों।\n\nप्रिय, एक पंक्ति में अपनी समस्या बताइए। **राधे राधे 🙏**`,
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

  const switchLanguage = useCallback((next: ChatLang) => {
    if (isLoading) return;
    setChatLang(next);
    setMessages([{ id: "welcome", role: "assistant", content: WELCOME[next] }]);
    setInput("");
    setShowSuggestions(true);
    inputRef.current?.focus();
  }, [isLoading]);

  const sendMessage = useCallback(async (text: string) => {
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
          ? (e.message || "कुछ गलत हुआ, कृपया फिर प्रयास करें")
          : (e.message || "Something went wrong, please try again"),
      );
      setIsLoading(false);
    }
  }, [chatLang, isLoading, messages]);

  const handleSend = useCallback(() => sendMessage(input), [input, sendMessage]);

  const handleVoiceResult = useCallback((text: string) => {
    setInput(text);
    sendMessage(text);
  }, [sendMessage]);

  const voiceLang = chatLang === "hi" ? "hi-IN" : "en-IN";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="flex flex-col h-screen bg-background"
    >
      <div className="flex items-center gap-4 px-6 py-4 border-b border-border bg-card/50 backdrop-blur-xl">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={20} />
        </button>

        <motion.div
          className="w-10 h-10 rounded-full bg-gradient-divine flex items-center justify-center shadow-divine"
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <span className="text-lg">🙏</span>
        </motion.div>

        <div className="flex-1">
          <h2 className="font-display font-semibold text-foreground text-lg">Gita Guide</h2>
          <p className="text-xs text-peacock font-body">
            {chatLang === "hi" ? "गीता से सीधा मार्गदर्शन" : "Direct guidance from the Gita"}
          </p>
        </div>

        <div className="flex items-center rounded-lg border border-border bg-secondary/60 p-1 gap-1">
          <button
            onClick={() => switchLanguage("en")}
            className={`px-2.5 py-1.5 rounded-md text-xs font-body transition-colors ${
              chatLang === "en" ? "bg-background text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
            title="English"
            disabled={isLoading}
          >
            EN
          </button>
          <button
            onClick={() => switchLanguage("hi")}
            className={`px-2.5 py-1.5 rounded-md text-xs font-body transition-colors ${
              chatLang === "hi" ? "bg-background text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
            title="Hindi"
            disabled={isLoading}
          >
            हिंदी
          </button>
          <Languages size={14} className="text-muted-foreground mr-1" />
        </div>
      </div>

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
                className={`max-w-[85%] md:max-w-[68%] px-5 py-4 rounded-2xl font-body text-sm md:text-base leading-relaxed ${
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

        {showSuggestions && messages.length === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap gap-2 justify-center pt-2"
          >
            {SUGGESTIONS[chatLang].map((s) => (
              <motion.button
                key={s}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
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
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-primary/60 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="px-4 md:px-6 py-4 border-t border-border bg-card/30 backdrop-blur-lg">
        <div className="flex items-center gap-3 max-w-3xl mx-auto">
          <VoiceButton onResult={handleVoiceResult} languageCode={voiceLang} />

          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={chatLang === "hi" ? "अपनी समस्या लिखें..." : "Share your problem..."}
            className="flex-1 bg-secondary border border-border rounded-xl px-5 py-3 font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
          />

          <motion.button
            whileTap={{ scale: 0.92 }}
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
