import { ArrowLeft, GraduationCap, Moon, Sun, Play, Accessibility } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useEditor } from "@/contexts/editor-context";
import { useTheme } from "@/contexts/theme-context";
import { useState, useRef, useEffect } from "react";
import SettingsMenu from "./settings-menu";

interface TopNavigationProps {
  activeTab: "preview" | "source";
  onTabChange: (tab: "preview" | "source") => void;
  onCompile?: () => void;
}

export default function TopNavigation({ activeTab, onTabChange, onCompile }: TopNavigationProps) {
  const navigate = useNavigate();
  const { dir } = useEditor();
  const { isDark, toggleTheme } = useTheme();
  const [isCompiling, setIsCompiling] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const settingsMenuRef = useRef<HTMLDivElement>(null);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);

  const handleBack = () => {
    navigate("/");
  };

  const handleCompile = async () => {
    if (!dir || !onCompile) return;
    
    setIsCompiling(true);
    try {
      await onCompile();
    } catch (error) {
      console.error("Compilation failed:", error);
    } finally {
      setIsCompiling(false);
    }
  };

  // Close menu when clicking outside
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
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showSettingsMenu]);

  return (
    <div className="h-12 border-b bg-background flex items-center justify-between px-4 relative">
      {/* Left side */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          className="h-8 w-8"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center">
            <GraduationCap 
              className="h-6 w-6" 
              style={{ 
                color: isDark ? '#60a5fa' : '#1e3a8a', // Navy blue (lighter in dark mode)
                filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))'
              }} 
            />
            <div 
              className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-background" 
              style={{ 
                backgroundColor: '#fbbf24', // Gold
                boxShadow: '0 0 4px rgba(251, 191, 36, 0.5)'
              }} 
            />
          </div>
          <span 
            className="font-semibold text-sm" 
            style={{ color: isDark ? '#93c5fd' : '#1e3a8a' }}
          >
            LaTeX Tool
          </span>
        </div>

        <div className="ml-4 inline-flex h-8 items-center rounded-lg bg-muted p-1 text-muted-foreground">
          <button
            onClick={() => onTabChange("preview")}
            className={`inline-flex items-center justify-center rounded-md px-3 py-1 text-xs font-medium transition-all ${
              activeTab === "preview"
                ? "bg-background text-foreground shadow"
                : "hover:text-foreground"
            }`}
          >
            PREVIEW
          </button>
          <button
            onClick={() => onTabChange("source")}
            className={`inline-flex items-center justify-center rounded-md px-3 py-1 text-xs font-medium transition-all ${
              activeTab === "source"
                ? "bg-background text-foreground shadow"
                : "hover:text-foreground"
            }`}
          >
            SOURCE
          </button>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={toggleTheme}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        
        <div className="relative">
          <Button
            ref={settingsButtonRef}
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setShowSettingsMenu(!showSettingsMenu)}
            title="Settings"
          >
            <Accessibility className="h-4 w-4" />
          </Button>
          {showSettingsMenu && (
            <div
              ref={settingsMenuRef}
              className="absolute right-0 top-12 z-50"
            >
              <SettingsMenu onClose={() => setShowSettingsMenu(false)} />
            </div>
          )}
        </div>

        <Button
          onClick={handleCompile}
          disabled={isCompiling || !dir}
          className="gap-2"
        >
          <Play className="h-4 w-4" />
          {isCompiling ? "Compiling..." : "Compile"}
        </Button>
      </div>
    </div>
  );
}
