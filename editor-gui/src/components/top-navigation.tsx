import { HelpCircle, Settings, Moon, Sun, Play } from "lucide-react";
import spartanLogo from "@/assets/spartan_32x32.png";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";
import SettingsMenu from "./settings-menu";
import { useTheme } from "@/contexts/theme-context";

interface TopNavigationProps {
  activeTab?: "preview" | "source";
  onTabChange?: (tab: "preview" | "source") => void;
  onCompile?: () => Promise<void>;
  canCompile?: boolean;
}

export default function TopNavigation({ activeTab, onTabChange, onCompile, canCompile }: TopNavigationProps = {}) {
  const { isDark, toggleTheme } = useTheme();
  const [isCompiling, setIsCompiling] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const settingsMenuRef = useRef<HTMLDivElement>(null);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);

  const handleCompile = async () => {
    if (!onCompile) return;
    setIsCompiling(true);
    try {
      await onCompile();
    } finally {
      setIsCompiling(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        settingsMenuRef.current &&
        !settingsMenuRef.current.contains(event.target as Node) &&
        settingsButtonRef.current &&
        !settingsButtonRef.current.contains(event.target as Node)
      ) {
        setShowSettingsMenu(false);
      }
    };

    if (showSettingsMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showSettingsMenu]);

  return (
    <div className="h-12 border-b bg-background flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <img src={spartanLogo} alt="Spartan Write" className="h-7 w-7" />
          <span className="font-bold text-lg">Spartan Write</span>
        </div>

        {activeTab !== undefined && onTabChange && (
          <div className="inline-flex h-8 items-center rounded-lg bg-muted p-1 text-muted-foreground">
            <button
              onClick={() => onTabChange("preview")}
              className={`inline-flex items-center justify-center rounded-md px-3 py-1 text-xs font-medium transition-all ${
                activeTab === "preview" ? "bg-background text-foreground shadow" : "hover:text-foreground"
                }`}
            >
              PREVIEW
            </button>
            <button
              onClick={() => onTabChange("source")}
              className={`inline-flex items-center justify-center rounded-md px-3 py-1 text-xs font-medium transition-all ${
                activeTab === "source" ? "bg-background text-foreground shadow" : "hover:text-foreground"
                }`}
            >
              SOURCE
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {onCompile && (
          <Button onClick={handleCompile} disabled={isCompiling || !canCompile} size="sm" className="gap-2">
            <Play className="h-3.5 w-3.5" />
            {isCompiling ? "Compiling..." : "Compile"}
          </Button>
        )}

        <Button variant="ghost" size="icon" className="h-8 w-8" title="Help">
          <HelpCircle className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          onClick={toggleTheme}
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <div className="relative">
          <Button
            ref={settingsButtonRef}
            variant="ghost"
            size="icon"
            className="h-8 w-8 cursor-pointer"
            title="Settings"
            onClick={() => setShowSettingsMenu(!showSettingsMenu)}
          >
            <Settings className="h-4 w-4" />
          </Button>
          {showSettingsMenu && (
            <div ref={settingsMenuRef} className="absolute right-0 top-10 z-50">
              <SettingsMenu onClose={() => setShowSettingsMenu(false)} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
