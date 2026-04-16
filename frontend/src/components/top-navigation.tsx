import { Link, useLocation, useNavigate } from "react-router-dom";
import { Accessibility, ArrowLeft, Settings, Play } from "lucide-react";
import BrandLogo from "./brand-logo";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useState, useEffect } from "react";
import AccessibilityMenu from "./accessibility-menu";

interface TopNavigationProps {
  activeTab?: "preview" | "source";
  onTabChange?: (tab: "preview" | "source") => void;
  onCompile?: () => Promise<void>;
  canCompile?: boolean;
  compileError?: string | null;
  onClearCompileError?: () => void;
}

export default function TopNavigation({
  activeTab,
  onTabChange,
  onCompile,
  canCompile,
  compileError,
  onClearCompileError,
}: TopNavigationProps = {}) {
  const location = useLocation();
  const navigate = useNavigate();
  const showBackToDashboard =
    location.pathname === "/settings" ||
    location.pathname === "/new-project" ||
    location.pathname === "/editor";
  const [isCompiling, setIsCompiling] = useState(false);
  const [showAccessibilityMenu, setShowAccessibilityMenu] = useState(false);
  const [isCompileErrorDialogOpen, setIsCompileErrorDialogOpen] = useState(false);

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
    if (!compileError) setIsCompileErrorDialogOpen(false);
  }, [compileError]);

  return (
    <TooltipProvider>
    <div className="h-12 border-b bg-background flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        {showBackToDashboard && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                aria-label="Back to projects"
                onClick={() => navigate("/dashboard")}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Back to projects</TooltipContent>
          </Tooltip>
        )}
        <Link
          to="/dashboard"
          className="inline-flex items-center rounded-md outline-offset-2 transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-ring"
          aria-label="Go to dashboard"
        >
          <BrandLogo />
        </Link>

        {activeTab !== undefined && onTabChange && (
          <div
            className="inline-flex h-8 items-center rounded-lg bg-muted p-1 text-muted-foreground"
            role="tablist"
            aria-label="Editor view"
          >
            <button
              role="tab"
              aria-selected={activeTab === "preview"}
              aria-controls="editor-preview-panel"
              onClick={() => onTabChange("preview")}
              className={`inline-flex items-center justify-center rounded-md px-3 py-1 text-xs font-medium transition-all ${
                activeTab === "preview" ? "bg-background text-foreground shadow" : "hover:text-foreground"
                }`}
            >
              PREVIEW
            </button>
            <button
              role="tab"
              aria-selected={activeTab === "source"}
              aria-controls="editor-source-panel"
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
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={handleCompile}
                disabled={isCompiling || !canCompile}
                size="sm"
                className="gap-2"
                aria-label={isCompiling ? "Compiling document" : "Compile document"}
              >
                <Play className="h-3.5 w-3.5" />
                {isCompiling ? "Compiling..." : "Compile"}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Compile LaTeX document (Ctrl+Enter)</TooltipContent>
          </Tooltip>
        )}

        {compileError && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label="View compilation error"
                onClick={() => setIsCompileErrorDialogOpen(true)}
                className="px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider rounded-full border border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
              >
                Error
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">View compilation error</TooltipContent>
          </Tooltip>
        )}

        <AccessibilityMenu
          open={showAccessibilityMenu}
          onOpenChange={setShowAccessibilityMenu}
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 cursor-pointer"
            aria-label="Open accessibility settings"
          >
            <Accessibility className="h-4 w-4" />
          </Button>
        </AccessibilityMenu>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Open settings" asChild>
              <Link to="/settings">
                <Settings className="h-4 w-4" />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Settings</TooltipContent>
        </Tooltip>
      </div>

      {compileError && isCompileErrorDialogOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="compile-error-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm"
        >
          <div className="bg-popover text-popover-foreground max-w-lg w-[90%] rounded-lg border shadow-lg">
            <div className="px-4 py-3 border-b">
              <h2 id="compile-error-title" className="text-sm font-semibold">Compilation Error</h2>
            </div>
            <div className="max-h-80 overflow-auto px-4 py-3">
              <pre className="whitespace-pre-wrap text-xs font-mono text-muted-foreground">
                {compileError}
              </pre>
            </div>
            <div className="flex justify-end gap-2 px-4 py-3 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClearCompileError?.();
                  setIsCompileErrorDialogOpen(false);
                }}
              >
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
    </TooltipProvider>
  );
}
