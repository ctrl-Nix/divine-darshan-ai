import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Send, ArrowLeft, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const GITA_QUOTES = [
  "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन। — अध्याय 2, श्लोक 47",
  "योगस्थः कुरु कर्माणि सङ्गं त्यक्त्वा धनञ्जय। — अध्याय 2, श्लोक 48",
  "वासांसि जीर्णानि यथा विहाय... — अध्याय 2, श्लोक 22",
];

const ChatInterface = ({ onBack }: { onBack: () => void }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "🙏 हरे कृष्ण! मैं कृष्ण हूँ, आपका मार्गदर्शक।\n\nअपनी कोई भी समस्या बताइए — चाहे वो तनाव हो, भय हो, क्रोध हो, या जीवन का कोई भी प्रश्न। **गीता में हर उत्तर है।**\n\nबोलिए या लिखिए, मैं सुन रहा हूँ... 🙏",
    },
  ]);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    // Simulated response (will be replaced with Gemini API)
    setTimeout(() => {
      const quote = GITA_QUOTES[Math.floor(Math.random() * GITA_QUOTES.length)];
      const response: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `🙏 पार्थ, आपकी चिंता समझ सकता हूँ।\n\nगीता कहती है:\n\n> *${quote}*\n\nइसका अर्थ है कि आपको अपने कर्म पर ध्यान देना चाहिए, फल की चिंता नहीं। जब आप निष्काम भाव से कर्म करते हैं, तो सारी चिंताएं स्वयं समाप्त हो जाती हैं।\n\n**याद रखिए — मैं हमेशा आपके साथ हूँ।** 🙏`,
      };
      setMessages((prev) => [...prev, response]);
      setIsLoading(false);
    }, 1500);
  };

  const toggleListening = () => {
    setIsListening(!isListening);
    // Voice recognition will be integrated with Sarvam AI
  };

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
        <div className="w-10 h-10 rounded-full bg-gradient-divine flex items-center justify-center shadow-divine">
          <Sparkles size={18} className="text-primary-foreground" />
        </div>
        <div>
          <h2 className="font-display font-semibold text-foreground text-lg">श्री कृष्ण</h2>
          <p className="text-xs text-peacock font-body">गीता AI • सदैव उपलब्ध</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 space-y-6">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] md:max-w-[70%] px-5 py-4 rounded-2xl font-body text-sm md:text-base leading-relaxed ${
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

        {isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
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

      {/* Input */}
      <div className="px-4 md:px-6 py-4 border-t border-border bg-card/30 backdrop-blur-lg">
        <div className="flex items-center gap-3 max-w-3xl mx-auto">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={toggleListening}
            className={`p-3 rounded-xl transition-all duration-300 ${
              isListening
                ? "bg-saffron text-primary-foreground shadow-divine animate-pulse"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            <Mic size={20} />
          </motion.button>

          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="अपनी समस्या बताइए..."
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

        {isListening && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-xs text-saffron font-body mt-2"
          >
            🎙️ सुन रहा हूँ... बोलिए
          </motion.p>
        )}
      </div>
    </motion.div>
  );
};

export default ChatInterface;
