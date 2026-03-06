import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type TextSize = "small" | "medium" | "large";

interface AccessibilityContextValue {
  textSize: TextSize;
  setTextSize: (size: TextSize) => void;
  highContrast: boolean;
  toggleHighContrast: () => void;
  screenReader: boolean;
  toggleScreenReader: () => void;
  magnifier: boolean;
  toggleMagnifier: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextValue | null>(null);

const ACCESSIBILITY_STORAGE_KEY = "latex-tool-accessibility";

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [textSize, setTextSizeState] = useState<TextSize>(() => {
    const stored = localStorage.getItem(ACCESSIBILITY_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return parsed.textSize || "medium";
      } catch {
        return "medium";
      }
    }
    return "medium";
  });

  const [highContrast, setHighContrast] = useState<boolean>(() => {
    const stored = localStorage.getItem(ACCESSIBILITY_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return parsed.highContrast || false;
      } catch {
        return false;
      }
    }
    return false;
  });

  const [screenReader, setScreenReader] = useState<boolean>(() => {
    const stored = localStorage.getItem(ACCESSIBILITY_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return parsed.screenReader || false;
      } catch {
        return false;
      }
    }
    return false;
  });

  const [magnifier, setMagnifier] = useState<boolean>(() => {
    const stored = localStorage.getItem(ACCESSIBILITY_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return parsed.magnifier || false;
      } catch {
        return false;
      }
    }
    return false;
  });

  const setTextSize = (size: TextSize) => {
    setTextSizeState(size);
    const root = document.documentElement;
    root.setAttribute("data-text-size", size);
  };

  const toggleHighContrast = () => {
    setHighContrast((prev) => {
      const newValue = !prev;
      const root = document.documentElement;
      if (newValue) {
        root.classList.add("high-contrast");
      } else {
        root.classList.remove("high-contrast");
      }
      return newValue;
    });
  };

  const toggleScreenReader = () => {
    setScreenReader((prev) => !prev);
  };

  const toggleMagnifier = () => {
    setMagnifier((prev) => !prev);
  };

  // Save to localStorage whenever settings change
  useEffect(() => {
    const settings = {
      textSize,
      highContrast,
      screenReader,
      magnifier,
    };
    localStorage.setItem(ACCESSIBILITY_STORAGE_KEY, JSON.stringify(settings));
  }, [textSize, highContrast, screenReader, magnifier]);

  // Apply initial settings
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-text-size", textSize);
    if (highContrast) {
      root.classList.add("high-contrast");
    }
  }, []);

  // Apply magnifier effect
  useEffect(() => {
    const root = document.documentElement;
    if (magnifier) {
      root.classList.add("magnifier-active");
    } else {
      root.classList.remove("magnifier-active");
    }
  }, [magnifier]);

  return (
    <AccessibilityContext.Provider
      value={{
        textSize,
        setTextSize,
        highContrast,
        toggleHighContrast,
        screenReader,
        toggleScreenReader,
        magnifier,
        toggleMagnifier,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error("useAccessibility must be used within AccessibilityProvider");
  }
  return context;
}
