import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, PhoneOff, MicOff } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";

type CallLang = "en" | "hi";
type VoiceLang = "en-IN" | "hi-IN";

const cleanTextForSpeech = (text: string) =>
  text
    .replace(/[*#>_~`]/g, "")
    .replace(/\[.*?\]\(.*?\)/g, "")
    .replace(/🙏.*$/gm, "")
    .replace(/\n{2,}/g, "\n")
    .trim();

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
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const analyserCleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (callActive) {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [callActive]);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  // ─── speakText: Sarvam TTS first, browser speechSynthesis fallback ───
  const speakText = useCallback(async (text: string): Promise<void> => {
    if (isEndingRef.current) return;

    const cleanedText = cleanTextForSpeech(text);
    if (!cleanedText) return;

    // Try Sarvam TTS first
    let sarvamPlayFailed = false;
    try {
      const { data, error } = await supabase.functions.invoke("sarvam-tts", {
        body: { text: cleanedText, language_code: voiceLang },
      });
      if (error) throw error;
      if (data?.audio) {
        const byteChars = atob(data.audio);
        const byteArray = new Uint8Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) byteArray[i] = byteChars.charCodeAt(i);
        const blob = new Blob([byteArray], { type: "audio/wav" });
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.setAttribute("playsinline", "true");
        audioRef.current = audio;
        const played = await new Promise<boolean>((resolve) => {
          audio.onended = () => { URL.revokeObjectURL(url); audioRef.current = null; resolve(true); };
          audio.onerror = () => { URL.revokeObjectURL(url); audioRef.current = null; resolve(false); };
          audio.play().catch(() => { URL.revokeObjectURL(url); audioRef.current = null; resolve(false); });
        });
        if (played) return; // Sarvam audio played successfully
        sarvamPlayFailed = true;
        console.warn("Sarvam audio play blocked (likely iOS), falling back to browser TTS");
      }
    } catch (e) {
      console.warn("Sarvam TTS failed, falling back to browser TTS", e);
    }

    if (isEndingRef.current) return;

    // Fallback: browser speechSynthesis
    return new Promise<void>((resolve) => {
      if (!window.speechSynthesis) { resolve(); return; }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(cleanedText);
      utterance.lang = voiceLang;
      utterance.rate = 0.92;
      utterance.pitch = 1.0;
      synthRef.current = utterance;
      utterance.onend = () => { synthRef.current = null; resolve(); };
      utterance.onerror = () => { synthRef.current = null; resolve(); };
      window.speechSynthesis.speak(utterance);
    });
  }, [voiceLang]);

  // ─── processAudio: STT → AI → TTS → listen again ───
  const processAudio = useCallback(async (blob: Blob) => {
    if (isEndingRef.current) return;
    setStatus("thinking");

    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve((reader.result as string).split(",")[1]);
        reader.readAsDataURL(blob);
      });

      const { data: sttData, error: sttError } = await supabase.functions.invoke("sarvam-stt", {
        body: { audio: base64, language_code: voiceLang, model: "saarika:v2.5" },
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
      if (!fullText) throw new Error("Empty AI response");

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatLang, voiceLang, speakText]);

  // ─── startListening with silence detection ───
  const startListening = useCallback(async () => {
    if (isEndingRef.current) return;

    setStatus("listening");
    setTranscript("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
          ? "audio/mp4"
          : "";

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      const recorderMime = recorder.mimeType || "audio/webm";

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      // onstop MUST be defined BEFORE recorder.start()
      recorder.onstop = async () => {
        clearTimeout(activeRecordTimeoutRef.current);
        if (analyserCleanupRef.current) {
          analyserCleanupRef.current();
          analyserCleanupRef.current = null;
        }
        stream.getTracks().forEach((t) => t.stop());
        if (isEndingRef.current) return;
        const blob = new Blob(chunksRef.current, { type: recorderMime });
        await processAudio(blob);
      };

      recorder.start();

      // ─── Silence detection using Web Audio API ───
      try {
        const audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 512;
        source.connect(analyser);
        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        let silenceStart: number | null = null;
        let hasSpoken = false;
        const SILENCE_THRESHOLD = 8;
        const SILENCE_DURATION = 2500; // 2.5s of silence before auto-stop

        const checkSilence = () => {
          if (recorder.state !== "recording" || isEndingRef.current) return;

          analyser.getByteTimeDomainData(dataArray);
          const rms = Math.sqrt(
            dataArray.reduce((sum, v) => sum + (v - 128) ** 2, 0) / dataArray.length
          );

          if (rms >= SILENCE_THRESHOLD) {
            hasSpoken = true;
            silenceStart = null;
          } else if (hasSpoken) {
            // Only start silence timer AFTER user has spoken at least once
            if (!silenceStart) silenceStart = Date.now();
            else if (Date.now() - silenceStart > SILENCE_DURATION) {
              recorder.stop();
              audioContext.close();
              return;
            }
          }

          requestAnimationFrame(checkSilence);
        };

        // Start checking after 2s to give user time to begin speaking
        setTimeout(() => requestAnimationFrame(checkSilence), 2000);

        analyserCleanupRef.current = () => {
          source.disconnect();
          audioContext.close().catch(() => {});
        };
      } catch {
        // AudioContext not available — rely on hard timeout
      }

      // Max-duration safety fallback
      activeRecordTimeoutRef.current = setTimeout(() => {
        if (recorder.state === "recording") {
          recorder.stop();
        }
      }, 45000);
    } catch (err) {
      console.error("Mic error:", err);
      toast.error(chatLang === "hi" ? "माइक्रोफोन में समस्या है।" : "Microphone error.");
    }
  }, [chatLang, processAudio]);

  const startCall = useCallback(async () => {
    try {
      setCallActive(true);
      setElapsed(0);
      isEndingRef.current = false;
      conversationRef.current = [];

      const greeting = voiceLang === "hi-IN"
        ? "जय श्री कृष्ण! मैं यहाँ आपका मार्गदर्शन करने के लिए हूँ। बताइए, आपके मन में क्या है?"
        : "Jai Shri Krishna! I am here to guide you. Please share what's on your mind.";

      setStatus("speaking");
      setResponse(greeting);
      await speakText(greeting);
      if (!isEndingRef.current) startListening();
    } catch {
      toast.error(chatLang === "hi" ? "कॉल के लिए माइक्रोफोन अनुमति दें।" : "Microphone access is required.");
    }
  }, [chatLang, voiceLang, speakText, startListening]);

  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const endCall = useCallback(() => {
    isEndingRef.current = true;

    // Stop Sarvam audio
    audioRef.current?.pause();
    audioRef.current = null;

    // Stop browser TTS
    window.speechSynthesis?.cancel();
    synthRef.current = null;

    clearTimeout(activeRecordTimeoutRef.current);
    if (analyserCleanupRef.current) {
      analyserCleanupRef.current();
      analyserCleanupRef.current = null;
    }
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setCallActive(false);
    setStatus("idle");
    setTranscript("");
    setResponse("");
    clearInterval(timerRef.current);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
      window.speechSynthesis?.cancel();
      clearTimeout(activeRecordTimeoutRef.current);
      if (analyserCleanupRef.current) {
        analyserCleanupRef.current();
        analyserCleanupRef.current = null;
      }
    };
  }, []);

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
