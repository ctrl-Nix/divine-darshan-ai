import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Index from "./pages/Index";
import Help from "./pages/Help";
import DailyDarshan from "./pages/DailyDarshan";
import VerseOfTheDay from "./pages/VerseOfTheDay";
import Journal from "./pages/Journal";
import JapaCounter from "./pages/JapaCounter";
import LeelaStories from "./pages/LeelaStories";
import NotFound from "./pages/NotFound";
import AartiPlayer from "./components/AartiPlayer";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/help" element={<Help />} />
            <Route path="/darshan" element={<DailyDarshan />} />
            <Route path="/verse" element={<VerseOfTheDay />} />
            <Route path="/journal" element={<Journal />} />
            <Route path="/japa" element={<JapaCounter />} />
            <Route path="/leela" element={<LeelaStories />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <AartiPlayer />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
