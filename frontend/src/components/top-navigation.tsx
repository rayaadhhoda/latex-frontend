import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, HelpCircle, Settings, Moon, Sun, Play } from "lucide-react";
import BrandLogo from "./brand-logo";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";
import AccessibilityMenu from "./accessibility-menu";
import { useTheme } from "@/contexts/theme-context";

interface TopNavigationProps {
  activeTab?: "preview" | "source";
  onTabChange?: (tab: "preview" | "source") => void;
  onCompile?: () => Promise<void>;
  canCompile?: boolean;
}

export default function TopNavigation({ activeTab, onTabChange, onCompile, canCompile }: TopNavigationProps = {}) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const isSettingsPage = location.pathname === "/settings";
  const [isCompiling, setIsCompiling] = useState(false);
  const [showAccessibilityMenu, setShowAccessibilityMenu] = useState(false);
  const accessibilityMenuRef = useRef<HTMLDivElement>(null);
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
        accessibilityMenuRef.current &&
        !accessibilityMenuRef.current.contains(event.target as Node) &&
        helpButtonRef.current &&
        !helpButtonRef.current.contains(event.target as Node)
      ) {
        setShowAccessibilityMenu(false);
      }
    };

    if (showAccessibilityMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showAccessibilityMenu]);

  return (
    <div className="h-12 border-b bg-background flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        {isSettingsPage && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            title="Back"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <Link
          to="/dashboard"
          className="inline-flex items-center rounded-md outline-offset-2 transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-ring"
          aria-label="Go to dashboard"
        >
          <BrandLogo />
        </Link>

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
            title="Accessibility"
            onClick={() =>
              setShowAccessibilityMenu(!showAccessibilityMenu)
            }
          >
            <HelpCircle className="h-4 w-4" />
          </Button>
          {showAccessibilityMenu && (
            <div
              ref={accessibilityMenuRef}
              className="absolute right-0 top-10 z-50 max-h-[min(85vh,calc(100vh-3rem))] overflow-y-auto overflow-x-hidden"
            >
              <AccessibilityMenu
                onClose={() => setShowAccessibilityMenu(false)}
              />
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
          <Link to="/settings">
            <Settings className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
