import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, PhoneOff, MicOff } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gita-chat`;

type CallLang = "en" | "hi";
type VoiceLang = "en-IN" | "hi-IN";

const stripMarkdownForSpeech = (text: string) =>
  text
    .replace(/[*#>_~`]/g, "")
    .replace(/\[.*?\]\(.*?\)/g, "")
    .replace(/🙏.*$/gm, "")
    .replace(/\n{2,}/g, "\n")
    // Fix English TTS pronunciation
    .replace(/\bGita\b/gi, "Geeta")
    .replace(/\bRadhe\b/gi, "Radhey")
    .replace(/\bShloka?\b/gi, "Shloak")
    .replace(/\bBhagavad\b/gi, "Bhuguvud")
    .trim();

const splitSpeechChunks = (text: string, maxLen = 180): string[] => {
  const parts = text.match(/[^.!?।\n]+[.!?।\n]*/g)?.map((p) => p.trim()).filter(Boolean) ?? [text];
  const chunks: string[] = [];
  let current = "";

  for (const part of parts) {
    if ((`${current} ${part}`).trim().length <= maxLen) {
      current = `${current} ${part}`.trim();
      continue;
    }
    if (current) chunks.push(current);
    if (part.length <= maxLen) {
      current = part;
    } else {
      for (let i = 0; i < part.length; i += maxLen) {
        chunks.push(part.slice(i, i + maxLen));
      }
      current = "";
    }
  }

  if (current) chunks.push(current);
  return chunks.length ? chunks : [text];
};

const loadVoices = async (): Promise<SpeechSynthesisVoice[]> => {
  if (typeof window === "undefined" || !window.speechSynthesis) return [];

  const existing = window.speechSynthesis.getVoices();
  if (existing.length) return existing;

  return new Promise((resolve) => {
    const onVoicesChanged = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length) {
        window.speechSynthesis.removeEventListener("voiceschanged", onVoicesChanged);
        resolve(voices);
      }
    };

    window.speechSynthesis.addEventListener("voiceschanged", onVoicesChanged);

    setTimeout(() => {
      window.speechSynthesis.removeEventListener("voiceschanged", onVoicesChanged);
      resolve(window.speechSynthesis.getVoices());
    }, 1800);
  });
};

const pickVoice = (voices: SpeechSynthesisVoice[], lang: VoiceLang) => {
  const base = lang.split("-")[0].toLowerCase();
  return (
    voices.find((v) => v.lang.toLowerCase() === lang.toLowerCase()) ||
    voices.find((v) => v.lang.toLowerCase().startsWith(base)) ||
    null
  );
};

const VoiceCallInterface = ({ onEnd }: { onEnd: () => void }) => {
  const [status, setStatus] = useState<"idle" | "listening" | "thinking" | "speaking" | "choosing">("choosing");
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [callActive, setCallActive] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [voiceLang, setVoiceLang] = useState<VoiceLang>("hi-IN");
  const [chatLang, setChatLang] = useState<CallLang>("hi");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const conversationRef = useRef<{ role: string; content: string }[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const isEndingRef = useRef(false);
  const activeRecordTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (callActive) {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [callActive]);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const speakText = useCallback(async (text: string) => {
    if (!window.speechSynthesis) return;

    const speechText = stripMarkdownForSpeech(text);
    if (!speechText) return;

    const voices = await loadVoices();
    const selectedVoice = pickVoice(voices, voiceLang);
    const chunks = splitSpeechChunks(speechText);

    for (const chunk of chunks) {
      if (isEndingRef.current) break;
      await new Promise<void>((resolve) => {
        const utterance = new SpeechSynthesisUtterance(chunk);
        utterance.lang = voiceLang;
        utterance.rate = 0.9;
        utterance.pitch = 1;
        if (selectedVoice) utterance.voice = selectedVoice;
        utterance.onend = () => resolve();
        utterance.onerror = () => resolve();
        window.speechSynthesis.speak(utterance);
      });
    }
  }, [voiceLang]);

  const startListening = useCallback(async () => {
    if (isEndingRef.current) return;

    setStatus("listening");
    setTranscript("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        clearTimeout(activeRecordTimeoutRef.current);
        stream.getTracks().forEach((t) => t.stop());
        if (isEndingRef.current) return;
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        await processAudio(blob);
      };

      recorder.start();

      // Safety cap only; no short involuntary cut-off
      activeRecordTimeoutRef.current = setTimeout(() => {
        if (recorder.state === "recording") recorder.stop();
      }, 120000);
    } catch {
      toast.error(chatLang === "hi" ? "माइक्रोफोन में समस्या है।" : "Microphone error.");
    }
  }, [chatLang]);

  const startCall = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setCallActive(true);
      setElapsed(0);
      isEndingRef.current = false;
      conversationRef.current = [];

      const greeting = chatLang === "hi"
        ? "जय श्री कृष्ण। आराम से बोलिए, मैं ध्यान से सुन रहा हूँ। जब पूरा हो जाए तो 'बोल चुका/चुकी' दबाएँ।"
        : "Jai Shri Krishna. Speak comfortably, I'm listening carefully. Press Done Speaking when you finish.";

      setStatus("speaking");
      setResponse(greeting);
      await speakText(greeting);
      if (!isEndingRef.current) startListening();
    } catch {
      toast.error(chatLang === "hi" ? "कॉल के लिए माइक्रोफोन अनुमति दें।" : "Microphone access is required for voice calls.");
    }
  }, [chatLang, speakText, startListening]);

  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const endCall = useCallback(() => {
    isEndingRef.current = true;
    window.speechSynthesis.cancel();
    clearTimeout(activeRecordTimeoutRef.current);
    mediaRecorderRef.current?.stop();
    setCallActive(false);
    setStatus("idle");
    setTranscript("");
    setResponse("");
    clearInterval(timerRef.current);
  }, []);

  const processAudio = async (blob: Blob) => {
    if (isEndingRef.current) return;
    setStatus("thinking");

    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve((reader.result as string).split(",")[1]);
        reader.readAsDataURL(blob);
      });

      const { data: sttData, error: sttError } = await supabase.functions.invoke("sarvam-stt", {
        body: { audio: base64, language_code: voiceLang },
      });
      if (sttError) throw sttError;

      const userText = sttData?.text?.trim();
      if (!userText) {
        toast(chatLang === "hi" ? "सुन नहीं पाया, फिर से बोलिए।" : "I couldn't hear that. Please try again.");
        if (!isEndingRef.current) startListening();
        return;
      }

      setTranscript(userText);
      conversationRef.current.push({ role: "user", content: userText });

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: conversationRef.current, language: chatLang }),
      });

      if (!resp.ok || !resp.body) throw new Error("AI request failed");

      const responseReader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";

      while (true) {
        const { done, value } = await responseReader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;

          const json = line.slice(6).trim();
          if (json === "[DONE]") continue;

          try {
            const parsed = JSON.parse(json);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) fullText += content;
          } catch {
            // ignore malformed partial chunks
          }
        }
      }

      if (isEndingRef.current) return;

      if (!fullText.trim()) {
        throw new Error("Empty AI response");
      }

      conversationRef.current.push({ role: "assistant", content: fullText });
      setResponse(fullText);
      setStatus("speaking");
      await speakText(fullText);

      if (!isEndingRef.current) startListening();
    } catch (e) {
      console.error("Call error:", e);
      toast.error(chatLang === "hi" ? "कुछ गलती हुई, दोबारा कोशिश करें।" : "Something went wrong. Please try again.");
      if (!isEndingRef.current) startListening();
    }
  };

  const bars = 12;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center h-screen bg-background relative overflow-hidden"
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[150px] glow-pulse" />
        <div className="absolute bottom-1/3 right-1/3 w-[400px] h-[400px] rounded-full bg-peacock/5 blur-[120px] glow-pulse" style={{ animationDelay: "2s" }} />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-6 px-6 max-w-xl w-full">
        <motion.p
          key={status}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm font-body text-muted-foreground tracking-wider uppercase text-center"
        >
          {!callActive
            ? (chatLang === "hi" ? "कॉल के लिए तैयार" : "Ready to call")
            : status === "listening"
              ? (chatLang === "hi" ? "🎙️ सुन रहा हूँ... आराम से बोलिए" : "🎙️ Listening... take your time")
              : status === "thinking"
                ? (chatLang === "hi" ? "🙏 गीता से उत्तर ढूंढ रहा हूँ..." : "🙏 Finding wisdom from Gita...")
                : status === "speaking"
                  ? (chatLang === "hi" ? "🗣️ बोल रहा हूँ..." : "🗣️ Speaking...")
                  : ""}
        </motion.p>

        <div className="relative">
          {callActive && [1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="absolute inset-0 rounded-full border border-primary/20"
              style={{ margin: `-${i * 20}px` }}
              animate={{
                scale: status === "speaking" ? [1, 1.1, 1] : status === "listening" ? [1, 1.05, 1] : 1,
                opacity: [0.3, 0.1, 0.3],
              }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.3, ease: "easeInOut" }}
            />
          ))}

          <motion.div
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-40 h-40 md:w-48 md:h-48 rounded-full bg-gradient-divine flex items-center justify-center shadow-divine"
          >
            <span className="text-6xl md:text-7xl">🙏</span>
          </motion.div>
        </div>

        {callActive && (
          <div className="flex items-center gap-1 h-10">
            {Array.from({ length: bars }).map((_, i) => (
              <motion.div
                key={i}
                className={`w-1 rounded-full ${status === "speaking" ? "bg-primary" : status === "listening" ? "bg-peacock" : "bg-muted-foreground/30"}`}
                animate={{ height: status === "speaking" || status === "listening" ? [8, Math.random() * 30 + 8, 8] : 8 }}
                transition={{ duration: 0.4 + Math.random() * 0.3, repeat: Infinity, delay: i * 0.05, ease: "easeInOut" }}
              />
            ))}
          </div>
        )}

        {callActive && <p className="font-body text-lg text-foreground/80 tabular-nums">{formatTime(elapsed)}</p>}

        {transcript && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card/60 border border-border rounded-2xl px-5 py-3 w-full"
          >
            <p className="text-xs text-muted-foreground mb-1 font-body">{chatLang === "hi" ? "आपने कहा:" : "You said:"}</p>
            <p className="text-sm font-body text-foreground">{transcript}</p>
          </motion.div>
        )}

        {response && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card/60 border border-border rounded-2xl px-5 py-3 w-full max-h-36 overflow-y-auto"
          >
            <p className="text-xs text-muted-foreground mb-1 font-body">{chatLang === "hi" ? "उत्तर:" : "Response:"}</p>
            <div className="text-sm font-body text-foreground leading-relaxed">
              <ReactMarkdown>{response}</ReactMarkdown>
            </div>
          </motion.div>
        )}

        {status === "choosing" && !callActive && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-6 w-full"
          >
            <p className="font-body text-foreground text-lg font-medium">Choose language / भाषा चुनें</p>
            <div className="flex gap-4">
              {[
                { code: "hi-IN" as VoiceLang, lang: "hi" as CallLang, label: "हिंदी", sub: "Hindi" },
                { code: "en-IN" as VoiceLang, lang: "en" as CallLang, label: "English", sub: "English" },
              ].map((l) => (
                <motion.button
                  key={l.code}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setVoiceLang(l.code);
                    setChatLang(l.lang);
                    setStatus("idle");
                  }}
                  className={`px-8 py-5 rounded-2xl border-2 font-body text-center transition-all ${
                    voiceLang === l.code
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-foreground hover:border-primary/40"
                  }`}
                >
                  <p className="text-xl font-semibold">{l.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{l.sub}</p>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {status !== "choosing" && (
          <div className="flex items-center gap-4 mt-2">
            {!callActive ? (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={startCall}
                className="w-20 h-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-divine transition-opacity hover:opacity-90"
              >
                <Phone size={32} />
              </motion.button>
            ) : (
              <>
                {status === "listening" && (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={stopListening}
                    className="px-5 py-3 rounded-xl bg-secondary text-secondary-foreground font-body text-sm border border-border flex items-center gap-2"
                  >
                    <MicOff size={16} />
                    {chatLang === "hi" ? "बोल चुका/चुकी" : "Done Speaking"}
                  </motion.button>
                )}

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    endCall();
                    onEnd();
                  }}
                  className="w-20 h-20 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-lg transition-opacity hover:opacity-90"
                >
                  <PhoneOff size={32} />
                </motion.button>
              </>
            )}
          </div>
        )}

        {!callActive && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={onEnd}
            className="text-sm font-body text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to home
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

export default VoiceCallInterface;
