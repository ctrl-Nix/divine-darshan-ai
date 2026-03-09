import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface VoiceButtonProps {
  onResult: (text: string) => void;
  languageCode?: string;
}

const VoiceButton = ({ onResult, languageCode = "hi-IN" }: VoiceButtonProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
          ? "audio/mp4"
          : "";
      const mediaRecorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      const recorderMime = mediaRecorder.mimeType || "audio/webm";

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const audioBlob = new Blob(chunksRef.current, { type: recorderMime });
        await processAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch {
      toast.error("Microphone access denied.");
    }
  }, []);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  }, []);

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(",")[1];
          resolve(base64);
        };
      });
      reader.readAsDataURL(audioBlob);
      const base64Audio = await base64Promise;

      const { data, error } = await supabase.functions.invoke("sarvam-stt", {
        body: { audio: base64Audio, language_code: languageCode },
      });

      if (error) throw error;
      if (data?.text) {
        onResult(data.text);
      } else {
        toast.error("Could not understand audio. Please try again.");
      }
    } catch (e: any) {
      console.error("STT error:", e);
      toast.error("Voice processing failed. Please type instead.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClick = () => {
    if (isProcessing) return;
    if (isRecording) stopRecording();
    else startRecording();
  };

  return (
    <button
      onClick={handleClick}
      disabled={isProcessing}
      className={`relative p-2.5 rounded-xl transition-all duration-200 ${
        isRecording
          ? "bg-primary text-primary-foreground shadow-divine"
          : isProcessing
            ? "bg-muted text-muted-foreground"
            : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
      }`}
    >
      {isProcessing ? (
        <Loader2 size={17} className="animate-spin" />
      ) : isRecording ? (
        <MicOff size={17} />
      ) : (
        <Mic size={17} />
      )}

      {isRecording && (
        <motion.div
          className="absolute inset-0 rounded-xl border border-primary/40"
          animate={{ scale: [1, 1.2], opacity: [0.5, 0] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
      )}
    </button>
  );
};

export default VoiceButton;
