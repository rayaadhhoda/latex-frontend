import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

interface SettingsContextValue {
  editorFontSize: number;
  setEditorFontSize: (size: number) => void;
  showLineNumbers: boolean;
  toggleLineNumbers: () => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

const SETTINGS_STORAGE_KEY = "latex-tool-settings";

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [editorFontSize, setEditorFontSizeState] = useState<number>(() => {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return parsed.editorFontSize || 14;
      } catch {
        return 14;
      }
    }
    return 14;
  });

  const [showLineNumbers, setShowLineNumbersState] = useState<boolean>(() => {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return parsed.showLineNumbers !== undefined ? parsed.showLineNumbers : true;
      } catch {
        return true;
      }
    }
    return true;
  });

  const setEditorFontSize = (size: number) => {
    setEditorFontSizeState(size);
  };

  const toggleLineNumbers = () => {
    setShowLineNumbersState((prev) => !prev);
  };

  // Save to localStorage whenever settings change
  useEffect(() => {
    const settings = {
      editorFontSize,
      showLineNumbers,
    };
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  }, [editorFontSize, showLineNumbers]);

  return (
    <SettingsContext.Provider
      value={{
        editorFontSize,
        setEditorFontSize,
        showLineNumbers,
        toggleLineNumbers,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within SettingsProvider");
  }
  return context;
}
