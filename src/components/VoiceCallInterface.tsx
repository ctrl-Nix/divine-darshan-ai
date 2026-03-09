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
    const playSarvamClip = (base64Audio: string) =>
      new Promise<boolean>((resolve) => {
        const byteChars = atob(base64Audio);
        const byteArray = new Uint8Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) byteArray[i] = byteChars.charCodeAt(i);
        const blob = new Blob([byteArray], { type: "audio/wav" });
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.setAttribute("playsinline", "true");
        audioRef.current = audio;

        audio.onended = () => {
          URL.revokeObjectURL(url);
          audioRef.current = null;
          resolve(true);
        };
        audio.onerror = () => {
          URL.revokeObjectURL(url);
          audioRef.current = null;
          resolve(false);
        };
        audio.play().catch(() => {
          URL.revokeObjectURL(url);
          audioRef.current = null;
          resolve(false);
        });
      });

    try {
      const { data, error } = await supabase.functions.invoke("sarvam-tts", {
        body: { text: cleanedText, language_code: voiceLang },
      });
      if (error) throw error;

      const audioClips: string[] = Array.isArray(data?.audios) && data.audios.length
        ? data.audios
        : data?.audio
          ? [data.audio]
          : [];

      if (audioClips.length) {
        for (const clip of audioClips) {
          if (isEndingRef.current) return;
          const played = await playSarvamClip(clip);
          if (!played) throw new Error("Sarvam audio playback blocked");
        }
        return;
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

  const bars = 10;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center h-screen bg-background relative overflow-hidden"
    >
      {/* Ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-primary/[0.03] blur-[120px] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center gap-5 px-6 max-w-md w-full">
        {/* Status text */}
        <motion.p
          key={status}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[11px] font-body text-muted-foreground tracking-[0.2em] uppercase text-center"
        >
          {!callActive
            ? chatLang === "hi" ? "कॉल शुरू करें" : "Ready to call"
            : status === "listening"
              ? chatLang === "hi" ? "सुन रहा हूँ..." : "Listening..."
              : status === "thinking"
                ? chatLang === "hi" ? "सोच रहा हूँ..." : "Finding wisdom..."
                : status === "speaking"
                  ? chatLang === "hi" ? "बोल रहा हूँ..." : "Speaking..."
                  : ""}
        </motion.p>

        {/* Avatar */}
        <div className="relative my-4">
          {callActive && (
            <motion.div
              className="absolute -inset-4 rounded-full border border-primary/15"
              animate={{
                scale: status === "speaking" || status === "listening" ? [1, 1.08, 1] : 1,
                opacity: [0.3, 0.1, 0.3],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-divine flex items-center justify-center shadow-divine">
            <span className="text-5xl md:text-6xl">🙏</span>
          </div>
        </div>

        {/* Audio bars */}
        {callActive && (
          <div className="flex items-center gap-[3px] h-8">
            {Array.from({ length: bars }).map((_, i) => (
              <motion.div
                key={i}
                className={`w-[3px] rounded-full ${
                  status === "speaking" ? "bg-primary" : status === "listening" ? "bg-peacock" : "bg-muted-foreground/20"
                }`}
                animate={{
                  height: status === "speaking" || status === "listening"
                    ? [6, Math.random() * 24 + 6, 6]
                    : 6,
                }}
                transition={{ duration: 0.4 + Math.random() * 0.3, repeat: Infinity, delay: i * 0.05, ease: "easeInOut" }}
              />
            ))}
          </div>
        )}

        {/* Timer */}
        {callActive && (
          <p className="font-body text-sm text-muted-foreground tabular-nums">{formatTime(elapsed)}</p>
        )}

        {/* Transcript */}
        {transcript && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-xl px-4 py-2.5 w-full"
          >
            <p className="text-[10px] text-muted-foreground mb-0.5 font-body uppercase tracking-wider">
              {chatLang === "hi" ? "आपने कहा" : "You said"}
            </p>
            <p className="text-sm font-body text-foreground">{transcript}</p>
          </motion.div>
        )}

        {/* Response */}
        {response && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-xl px-4 py-2.5 w-full max-h-32 overflow-y-auto"
          >
            <p className="text-[10px] text-muted-foreground mb-0.5 font-body uppercase tracking-wider">
              {chatLang === "hi" ? "उत्तर" : "Response"}
            </p>
            <div className="text-sm font-body text-foreground leading-relaxed">
              <ReactMarkdown>{response}</ReactMarkdown>
            </div>
          </motion.div>
        )}

        {/* Language chooser */}
        {status === "choosing" && !callActive && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-5 w-full mt-2"
          >
            <p className="font-body text-foreground text-sm font-medium">
              Choose language / भाषा चुनें
            </p>
            <div className="flex gap-3 w-full">
              {[
                { code: "hi-IN" as VoiceLang, lang: "hi" as CallLang, label: "हिंदी", sub: "Hindi" },
                { code: "en-IN" as VoiceLang, lang: "en" as CallLang, label: "English", sub: "English" },
              ].map((l) => (
                <button
                  key={l.code}
                  onClick={() => {
                    setVoiceLang(l.code);
                    setChatLang(l.lang);
                    setStatus("idle");
                  }}
                  className={`flex-1 py-4 rounded-xl border font-body text-center transition-all duration-200 ${
                    voiceLang === l.code
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border bg-card text-foreground hover:border-primary/25"
                  }`}
                >
                  <p className="text-lg font-semibold">{l.label}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{l.sub}</p>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Call controls */}
        {status !== "choosing" && (
          <div className="flex items-center gap-4 mt-3">
            {!callActive ? (
              <button
                onClick={startCall}
                className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-divine hover:shadow-[0_4px_32px_-4px_hsl(var(--primary)/0.35)] transition-all duration-200"
              >
                <Phone size={26} />
              </button>
            ) : (
              <>
                {status === "listening" && (
                  <button
                    onClick={stopListening}
                    className="px-4 py-2.5 rounded-xl bg-secondary text-secondary-foreground font-body text-sm border border-border flex items-center gap-2 hover:bg-secondary/80 transition-colors"
                  >
                    <MicOff size={15} />
                    {chatLang === "hi" ? "बोल चुका/चुकी" : "Done"}
                  </button>
                )}

                <button
                  onClick={() => { endCall(); onEnd(); }}
                  className="w-16 h-16 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-lg hover:opacity-90 transition-opacity"
                >
                  <PhoneOff size={26} />
                </button>
              </>
            )}
          </div>
        )}

        {/* Back link */}
        {!callActive && (
          <button
            onClick={onEnd}
            className="mt-4 text-[13px] font-body text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to home
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default VoiceCallInterface;
