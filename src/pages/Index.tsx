import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import HeroSection from "@/components/HeroSection";
import ChatInterface from "@/components/ChatInterface";

const Index = () => {
  const [showChat, setShowChat] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <AnimatePresence mode="wait">
        {showChat ? (
          <ChatInterface key="chat" onBack={() => setShowChat(false)} />
        ) : (
          <HeroSection key="hero" onStartChat={() => setShowChat(true)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
