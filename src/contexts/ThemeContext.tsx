import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Theme = "light" | "dark";
type TextSize = "normal" | "large" | "xlarge";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  textSize: TextSize;
  cycleTextSize: () => void;
  highContrast: boolean;
  toggleHighContrast: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const TEXT_SIZE_MAP: Record<TextSize, string> = {
  normal: "100%",
  large: "112%",
  xlarge: "125%",
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem("gita-theme");
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  const [textSize, setTextSize] = useState<TextSize>(() => {
    const saved = localStorage.getItem("gita-text-size");
    return (saved as TextSize) || "normal";
  });

  const [highContrast, setHighContrast] = useState(() => {
    return localStorage.getItem("gita-high-contrast") === "1";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.classList.toggle("light", theme === "light");
    localStorage.setItem("gita-theme", theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.style.fontSize = TEXT_SIZE_MAP[textSize];
    localStorage.setItem("gita-text-size", textSize);
  }, [textSize]);

  useEffect(() => {
    document.documentElement.classList.toggle("high-contrast", highContrast);
    localStorage.setItem("gita-high-contrast", highContrast ? "1" : "0");
  }, [highContrast]);

  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  const cycleTextSize = () =>
    setTextSize((s) => (s === "normal" ? "large" : s === "large" ? "xlarge" : "normal"));

  const toggleHighContrast = () => setHighContrast((v) => !v);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, textSize, cycleTextSize, highContrast, toggleHighContrast }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
};
