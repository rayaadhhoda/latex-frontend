import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, HelpCircle, Settings, Moon, Sun, Play } from "lucide-react";
import BrandLogo from "./brand-logo";
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

type SettingsLocationState = { editorSearch?: string };

export default function TopNavigation({ activeTab, onTabChange, onCompile, canCompile }: TopNavigationProps = {}) {
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();
  const isSettingsPage = location.pathname === "/settings";
  const editorSearchFromState = (location.state as SettingsLocationState | null)?.editorSearch ?? "";
  const [isCompiling, setIsCompiling] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const settingsMenuRef = useRef<HTMLDivElement>(null);
  const helpButtonRef = useRef<HTMLButtonElement>(null);

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
        helpButtonRef.current &&
        !helpButtonRef.current.contains(event.target as Node)
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
        {isSettingsPage && (
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" title="Back to editor" asChild>
            <Link to={{ pathname: "/editor", search: editorSearchFromState }}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
        )}
        <BrandLogo />

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

        <div className="relative">
          <Button
            ref={helpButtonRef}
            variant="ghost"
            size="icon"
            className="h-8 w-8 cursor-pointer"
            title="Help"
            onClick={() => setShowSettingsMenu(!showSettingsMenu)}
          >
            <HelpCircle className="h-4 w-4" />
          </Button>
          {showSettingsMenu && (
            <div ref={settingsMenuRef} className="absolute right-0 top-10 z-50">
              <SettingsMenu onClose={() => setShowSettingsMenu(false)} />
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          onClick={toggleTheme}
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <Button variant="ghost" size="icon" className="h-8 w-8" title="Settings" asChild>
          <Link
            to="/settings"
            state={location.pathname === "/editor" ? { editorSearch: location.search } : undefined}
          >
            <Settings className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
