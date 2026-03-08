import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, PhoneOff, MicOff } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";

type CallLang = "en" | "hi";
type VoiceLang = "en-IN" | "hi-IN";

const stripMarkdownForSpeech = (text: string) =>
  text
    .replace(/[*#>_~`]/g, "")
    .replace(/\[.*?\]\(.*?\)/g, "")
    .replace(/🙏.*$/gm, "")
    .replace(/\n{2,}/g, "\n")
    .replace(/\bGita\b/gi, "Geeta")
    .replace(/\bRadhe\b/gi, "Radhey")
    .replace(/\bShloka?\b/gi, "Shloak")
    .replace(/\bBhagavad\b/gi, "Bhuguvud")
    .trim();

/** Pick best supported mime type for MediaRecorder */
const getRecorderMime = (): string => {
  const types = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg", ""];
  for (const t of types) {
    if (!t || MediaRecorder.isTypeSupported(t)) return t;
  }
  return "";
};

const waitForVoices = async (): Promise<SpeechSynthesisVoice[]> => {
  if (!window.speechSynthesis) return [];
  for (let i = 0; i < 7; i++) {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length) return voices;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  return window.speechSynthesis.getVoices();
};

const pickPreferredVoice = (voices: SpeechSynthesisVoice[], preferredLang: VoiceLang) => {
  const exactLang = preferredLang.toLowerCase();
  const baseLang = exactLang.split("-")[0];
  const localVoices = voices.filter((v) => v.localService);

  for (const pool of [localVoices, voices]) {
    const exact = pool.find((v) => v.lang.toLowerCase() === exactLang);
    if (exact) return exact;
    const sameBase = pool.find((v) => v.lang.toLowerCase().startsWith(baseLang));
    if (sameBase) return sameBase;
  }

  return voices[0];
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
  // Keep-alive interval to prevent mobile browsers from pausing speechSynthesis
  const speechKeepAliveRef = useRef<ReturnType<typeof setInterval>>();
  // Track if we've "unlocked" speech on iOS via user gesture
  const speechUnlockedRef = useRef(false);

  useEffect(() => {
    if (callActive) {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [callActive]);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  /**
   * Unlock speechSynthesis on iOS by speaking a silent utterance from user gesture.
   * Must be called directly inside a click handler.
   */
  const unlockSpeech = useCallback(() => {
    if (speechUnlockedRef.current) return;
    if (!window.speechSynthesis) return;
    const u = new SpeechSynthesisUtterance("");
    u.volume = 0;
    u.lang = "en-US";
    window.speechSynthesis.speak(u);
    speechUnlockedRef.current = true;
  }, []);

  const speakText = useCallback(async (text: string): Promise<void> => {
    if (!window.speechSynthesis) return;

    const speechText = stripMarkdownForSpeech(text);
    if (!speechText) return;

    const synth = window.speechSynthesis;

    // Cancel any ongoing speech
    synth.cancel();

    // On mobile Chrome, speechSynthesis can pause after some seconds
    clearInterval(speechKeepAliveRef.current);
    speechKeepAliveRef.current = setInterval(() => {
      if (synth.speaking && !synth.paused) {
        synth.pause();
        synth.resume();
      }
    }, 5000);

    const voices = await waitForVoices();
    const preferredVoice = pickPreferredVoice(voices, voiceLang);
    const englishFallbackVoice = pickPreferredVoice(voices, "en-IN");

    const trySpeak = (lang: string, voice?: SpeechSynthesisVoice): Promise<boolean> =>
      new Promise<boolean>((resolve) => {
        let settled = false;

        const finish = (ok: boolean) => {
          if (settled) return;
          settled = true;
          resolve(ok);
        };

        const utterance = new SpeechSynthesisUtterance(speechText);
        utterance.lang = lang;
        utterance.rate = 0.9;
        utterance.volume = 1;
        utterance.pitch = 1;
        if (voice) utterance.voice = voice;

        utterance.onend = () => finish(true);
        utterance.onerror = (e) => {
          console.warn("TTS error:", e);
          finish(false);
        };

        synth.resume();
        synth.speak(utterance);

        setTimeout(() => {
          if (!synth.speaking) finish(false);
        }, 1600);

        // Hard timeout for buggy Chrome voice-event edge cases
        setTimeout(() => finish(true), Math.min(15000, Math.max(5000, speechText.length * 120)));
      });

    const primaryOk = await trySpeak(voiceLang, preferredVoice);
    if (!primaryOk) {
      synth.cancel();
      const secondaryOk = await trySpeak(voiceLang);
      if (!secondaryOk) {
        synth.cancel();
        await trySpeak("en-US", englishFallbackVoice);
      }
    }

    clearInterval(speechKeepAliveRef.current);
  }, [voiceLang]);

  const startListening = useCallback(async () => {
    if (isEndingRef.current) return;

    setStatus("listening");
    setTranscript("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getRecorderMime();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        clearTimeout(activeRecordTimeoutRef.current);
        stream.getTracks().forEach((t) => t.stop());
        if (isEndingRef.current) return;
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        await processAudio(blob);
      };

      recorder.start();

      activeRecordTimeoutRef.current = setTimeout(() => {
        if (recorder.state === "recording") recorder.stop();
      }, 120000);
    } catch (err) {
      console.error("Mic error:", err);
      toast.error(chatLang === "hi" ? "माइक्रोफोन में समस्या है।" : "Microphone error.");
    }
  }, [chatLang]);

  const startCall = useCallback(async () => {
    try {
      // Unlock speech on iOS — MUST happen in this click handler
      unlockSpeech();

      const permissionStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      permissionStream.getTracks().forEach((t) => t.stop());
      setCallActive(true);
      setElapsed(0);
      isEndingRef.current = false;
      conversationRef.current = [];

      // Pre-load voices
      window.speechSynthesis?.getVoices();

      const greeting = chatLang === "hi"
        ? "जय श्री कृष्ण। आराम से बोलिए, मैं ध्यान से सुन रहा हूँ। जब पूरा हो जाए तो 'बोल चुका' दबाएँ।"
        : "Jai Shri Krishna. Speak comfortably, I am listening carefully. Press Done Speaking when you finish.";

      setStatus("speaking");
      setResponse(greeting);
      await speakText(greeting);
      if (!isEndingRef.current) startListening();
    } catch {
      toast.error(chatLang === "hi" ? "कॉल के लिए माइक्रोफोन अनुमति दें।" : "Microphone access is required.");
    }
  }, [chatLang, speakText, startListening, unlockSpeech]);

  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const endCall = useCallback(() => {
    isEndingRef.current = true;
    // Force stop speech immediately — call cancel multiple times for mobile reliability
    window.speechSynthesis?.cancel();
    setTimeout(() => window.speechSynthesis?.cancel(), 100);
    setTimeout(() => window.speechSynthesis?.cancel(), 300);
    clearTimeout(activeRecordTimeoutRef.current);
    clearInterval(speechKeepAliveRef.current);
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setCallActive(false);
    setStatus("idle");
    setTranscript("");
    setResponse("");
    clearInterval(timerRef.current);
  }, []);

  // Cleanup on unmount — stop any lingering speech
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
      clearInterval(speechKeepAliveRef.current);
      clearTimeout(activeRecordTimeoutRef.current);
    };
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

      const { data: chatData, error: chatError } = await supabase.functions.invoke("gita-chat", {
        body: { messages: conversationRef.current, language: chatLang, stream: false },
      });
      if (chatError) throw chatError;

      const fullText = chatData?.text?.trim?.() ?? "";

      if (isEndingRef.current) return;

      if (!fullText) {
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
            ? (chatLang === "hi" ? "कॉल शुरू करें" : "Ready to call")
            : status === "listening"
              ? (chatLang === "hi" ? "🎙️ सुन रहा हूँ... आराम से बोलिए" : "🎙️ Listening... take your time")
              : status === "thinking"
                ? (chatLang === "hi" ? "🙏 गीता से उत्तर ढूंढ रहा हूँ..." : "🙏 Finding wisdom...")
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
                    unlockSpeech(); // Unlock on language selection tap too
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
                  onClick={() => { endCall(); onEnd(); }}
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
