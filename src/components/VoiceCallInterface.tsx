import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, PhoneOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gita-chat`;

const VoiceCallInterface = ({ onEnd }: { onEnd: () => void }) => {
  const [status, setStatus] = useState<"idle" | "listening" | "thinking" | "speaking">("idle");
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [callActive, setCallActive] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const conversationRef = useRef<{ role: string; content: string }[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isEndingRef = useRef(false);

  useEffect(() => {
    if (callActive) {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [callActive]);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const startCall = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setCallActive(true);
      setElapsed(0);
      isEndingRef.current = false;
      conversationRef.current = [];

      // Speak greeting
      setStatus("speaking");
      setResponse("Jai Shri Krishna! I am here to guide you. Please share what's on your mind.");
      await speakText("Jai Shri Krishna! I am here to guide you. Please share what's on your mind.");
      if (!isEndingRef.current) startListening();
    } catch {
      toast.error("Microphone access is required for voice calls.");
    }
  }, []);

  const endCall = useCallback(() => {
    isEndingRef.current = true;
    window.speechSynthesis.cancel();
    mediaRecorderRef.current?.stop();
    setCallActive(false);
    setStatus("idle");
    setTranscript("");
    setResponse("");
    clearInterval(timerRef.current);
  }, []);

  const speakText = (text: string): Promise<void> => {
    return new Promise((resolve) => {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-IN";
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      synthRef.current = utterance;
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      window.speechSynthesis.speak(utterance);
    });
  };

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
        stream.getTracks().forEach((t) => t.stop());
        if (isEndingRef.current) return;
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        await processAudio(blob);
      };

      recorder.start();

      // Auto-stop after 10 seconds of recording
      setTimeout(() => {
        if (recorder.state === "recording") recorder.stop();
      }, 10000);
    } catch {
      toast.error("Microphone error");
    }
  }, []);

  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const processAudio = async (blob: Blob) => {
    if (isEndingRef.current) return;
    setStatus("thinking");

    try {
      // STT
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve((reader.result as string).split(",")[1]);
        reader.readAsDataURL(blob);
      });

      const { data: sttData, error: sttError } = await supabase.functions.invoke("sarvam-stt", {
        body: { audio: base64 },
      });
      if (sttError) throw sttError;

      const userText = sttData?.text?.trim();
      if (!userText) {
        toast("I couldn't hear that. Please try again.");
        if (!isEndingRef.current) startListening();
        return;
      }

      setTranscript(userText);
      conversationRef.current.push({ role: "user", content: userText });

      // Get AI response (non-streaming)
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: conversationRef.current }),
      });

      if (!resp.ok) throw new Error("AI request failed");

      // Parse SSE stream to get full response
      const responseReader = resp.body!.getReader();
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
          if (json === "[DONE]") break;
          try {
            const parsed = JSON.parse(json);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) fullText += content;
          } catch {}
        }
      }

      if (isEndingRef.current) return;

      // Clean markdown for speech
      const cleanText = fullText
        .replace(/[*#>_~`]/g, "")
        .replace(/\[.*?\]\(.*?\)/g, "")
        .replace(/🙏.*$/gm, "")
        .trim();

      conversationRef.current.push({ role: "assistant", content: fullText });
      setResponse(fullText);
      setStatus("speaking");
      await speakText(cleanText);

      if (!isEndingRef.current) startListening();
    } catch (e: any) {
      console.error("Call error:", e);
      toast.error("Something went wrong. Please try again.");
      if (!isEndingRef.current) startListening();
    }
  };

  // Visualizer bars
  const bars = 12;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center h-screen bg-background relative overflow-hidden"
    >
      {/* Background ambient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[150px] glow-pulse" />
        <div className="absolute bottom-1/3 right-1/3 w-[400px] h-[400px] rounded-full bg-peacock/5 blur-[120px] glow-pulse" style={{ animationDelay: "2s" }} />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-8 px-6 max-w-lg w-full">
        {/* Status text */}
        <motion.p
          key={status}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm font-body text-muted-foreground tracking-wider uppercase"
        >
          {!callActive
            ? "Ready to call"
            : status === "listening"
            ? "🎙️ Listening..."
            : status === "thinking"
            ? "🙏 Finding wisdom..."
            : status === "speaking"
            ? "🗣️ Speaking..."
            : ""}
        </motion.p>

        {/* Central orb */}
        <div className="relative">
          {/* Pulsing rings */}
          {callActive && (
            <>
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  className="absolute inset-0 rounded-full border border-primary/20"
                  style={{ margin: `-${i * 20}px` }}
                  animate={{
                    scale: status === "speaking" ? [1, 1.1, 1] : status === "listening" ? [1, 1.05, 1] : 1,
                    opacity: [0.3, 0.1, 0.3],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.3,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </>
          )}

          <motion.div
            animate={
              callActive
                ? {
                    boxShadow:
                      status === "speaking"
                        ? ["0 0 30px hsl(36 90% 55% / 0.3)", "0 0 60px hsl(36 90% 55% / 0.5)", "0 0 30px hsl(36 90% 55% / 0.3)"]
                        : status === "listening"
                        ? ["0 0 30px hsl(180 60% 40% / 0.3)", "0 0 50px hsl(180 60% 40% / 0.5)", "0 0 30px hsl(180 60% 40% / 0.3)"]
                        : "0 0 20px hsl(36 90% 55% / 0.2)",
                  }
                : {}
            }
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-40 h-40 md:w-48 md:h-48 rounded-full bg-gradient-divine flex items-center justify-center shadow-divine"
          >
            <span className="text-6xl md:text-7xl">🙏</span>
          </motion.div>
        </div>

        {/* Audio visualizer */}
        {callActive && (
          <div className="flex items-center gap-1 h-12">
            {Array.from({ length: bars }).map((_, i) => (
              <motion.div
                key={i}
                className={`w-1 rounded-full ${
                  status === "speaking"
                    ? "bg-primary"
                    : status === "listening"
                    ? "bg-peacock"
                    : "bg-muted-foreground/30"
                }`}
                animate={{
                  height:
                    status === "speaking" || status === "listening"
                      ? [8, Math.random() * 40 + 8, 8]
                      : 8,
                }}
                transition={{
                  duration: 0.4 + Math.random() * 0.3,
                  repeat: Infinity,
                  delay: i * 0.05,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
        )}

        {/* Timer */}
        {callActive && (
          <p className="font-body text-lg text-foreground/80 tabular-nums">{formatTime(elapsed)}</p>
        )}

        {/* Transcript / Response */}
        <AnimatePresence mode="wait">
          {transcript && (
            <motion.div
              key="transcript"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-card/60 border border-border rounded-2xl px-5 py-3 max-w-full w-full"
            >
              <p className="text-xs text-muted-foreground mb-1 font-body">You said:</p>
              <p className="text-sm font-body text-foreground">{transcript}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Call/End button */}
        <div className="flex items-center gap-6 mt-4">
          {!callActive ? (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={startCall}
              className="w-20 h-20 rounded-full bg-green-600 hover:bg-green-500 text-white flex items-center justify-center shadow-lg transition-colors"
            >
              <Phone size={32} />
            </motion.button>
          ) : (
            <>
              {status === "listening" && (
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={stopListening}
                  className="px-6 py-3 rounded-xl bg-primary/20 text-primary font-body text-sm border border-primary/30"
                >
                  Done speaking
                </motion.button>
              )}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => { endCall(); onEnd(); }}
                className="w-20 h-20 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg transition-colors"
              >
                <PhoneOff size={32} />
              </motion.button>
            </>
          )}
        </div>

        {!callActive && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={onEnd}
            className="text-sm font-body text-muted-foreground hover:text-foreground transition-colors mt-2"
          >
            ← Back to home
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

export default VoiceCallInterface;
