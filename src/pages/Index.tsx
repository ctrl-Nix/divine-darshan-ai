import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import HeroSection from "@/components/HeroSection";
import ChatInterface from "@/components/ChatInterface";
import VoiceCallInterface from "@/components/VoiceCallInterface";
import DisclaimerDialog from "@/components/DisclaimerDialog";
import ParticleBackground from "@/components/ParticleBackground";
import AccessibilityControls from "@/components/AccessibilityControls";

type View = "hero" | "chat" | "call";

const Index = () => {
  const [view, setView] = useState<View>("hero");

  return (
    <div className="min-h-screen bg-background">
      <ParticleBackground />
      {view === "hero" && <AccessibilityControls />}
      <DisclaimerDialog />
      <AnimatePresence mode="wait">
        {view === "chat" ? (
          <ChatInterface key="chat" onBack={() => setView("hero")} />
        ) : view === "call" ? (
          <VoiceCallInterface key="call" onEnd={() => setView("hero")} />
        ) : (
          <HeroSection
            key="hero"
            onStartChat={() => setView("chat")}
            onStartCall={() => setView("call")}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
