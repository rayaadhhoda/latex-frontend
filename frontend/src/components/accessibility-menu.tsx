import {
  Accessibility,
  ALargeSmall,
  Code,
  Contrast,
  Hash,
  Monitor,
  Moon,
  Palette,
  Scaling,
  Sun,
  Type,
  Volume2,
  X,
  ZoomIn,
} from "lucide-react";
import {
  PDF_ZOOM_MAX,
  PDF_ZOOM_MIN,
  PDF_ZOOM_STEP,
  useAccessibility,
} from "@/contexts/accessibility-context";
import { useSettings } from "@/contexts/settings-context";
import { useTheme } from "@/contexts/theme-context";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AccessibilityMenuProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function OptionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
}) {
  return (
    <div
      className={`flex gap-3 ${description ? "items-start" : "items-center"}`}
    >
      <Icon
        className={`h-4 w-4 shrink-0 text-muted-foreground ${description ? "mt-0.5" : ""}`}
      />
      <div className="min-w-0 flex-1 space-y-0.5">
        <span className="text-sm font-medium leading-none">{title}</span>
        {description ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
    </div>
  );
}

export default function AccessibilityMenu({
  children,
  open,
  onOpenChange,
}: AccessibilityMenuProps) {
  const { themePreference, setThemePreference } = useTheme();

  const {
    textSize,
    setTextSize,
    screenReader,
    toggleScreenReader,
    magnifier,
    toggleMagnifier,
    pdfZoomPercent,
    setPdfZoomPercent,
  } = useAccessibility();

  const {
    editorFontSize,
    setEditorFontSize,
    showLineNumbers,
    toggleLineNumbers,
  } = useSettings();

  const handleFontSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 8 && value <= 32) {
      setEditorFontSize(value);
    }
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>{children}</PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">Accessibility</TooltipContent>
      </Tooltip>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-96 max-h-[min(85vh,calc(100vh-3rem))] overflow-y-auto overflow-x-hidden p-0"
      >
        <Card className="border-0 shadow-none">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Accessibility className="h-5 w-5" />
              Accessibility
            </CardTitle>
            <PopoverClose asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                className="h-6 w-6"
                aria-label="Close accessibility menu"
              >
                <X className="h-4 w-4" />
              </Button>
            </PopoverClose>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Appearance / theme */}
            <div className="space-y-3">
              <OptionHeader
                icon={Palette}
                title="Theme"
                description="Color scheme and contrast"
              />
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={themePreference === "system" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setThemePreference("system")}
                  className="h-auto min-h-10 flex-col gap-1 py-2"
                >
                  <Monitor className="h-4 w-4 shrink-0" />
                  <span className="text-xs leading-tight">System</span>
                </Button>
                <Button
                  variant={themePreference === "light" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setThemePreference("light")}
                  className="h-auto min-h-10 flex-col gap-1 py-2"
                >
                  <Sun className="h-4 w-4 shrink-0" />
                  <span className="text-xs leading-tight">Light</span>
                </Button>
                <Button
                  variant={themePreference === "dark" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setThemePreference("dark")}
                  className="h-auto min-h-10 flex-col gap-1 py-2"
                >
                  <Moon className="h-4 w-4 shrink-0" />
                  <span className="text-xs leading-tight">Dark</span>
                </Button>
                <Button
                  variant={
                    themePreference === "high-contrast" ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => setThemePreference("high-contrast")}
                  className="h-auto min-h-10 flex-col gap-1 py-2"
                >
                  <Contrast className="h-4 w-4 shrink-0" />
                  <span className="text-xs leading-tight">High contrast</span>
                </Button>
              </div>
            </div>

            {/* PDF zoom */}
            <div className="space-y-3">
              <OptionHeader icon={Scaling} title="PDF zoom" />
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={PDF_ZOOM_MIN}
                  max={PDF_ZOOM_MAX}
                  step={PDF_ZOOM_STEP}
                  value={pdfZoomPercent}
                  onChange={(e) => setPdfZoomPercent(Number(e.target.value))}
                  className="h-2 w-full min-w-0 flex-1 cursor-pointer accent-primary"
                  aria-label="PDF preview zoom"
                />
                <span className="text-muted-foreground w-12 shrink-0 text-right text-sm tabular-nums">
                  {pdfZoomPercent}%
                </span>
              </div>
            </div>

            {/* Text size */}
            <div className="space-y-3">
              <OptionHeader icon={ALargeSmall} title="Text size" />
              <div className="flex gap-2">
                <Button
                  variant={textSize === "small" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTextSize("small")}
                  className="h-10 flex-1"
                >
                  <span className="text-xs">Aa</span>
                </Button>
                <Button
                  variant={textSize === "medium" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTextSize("medium")}
                  className="h-10 flex-1"
                >
                  <span className="text-sm">Aa</span>
                </Button>
                <Button
                  variant={textSize === "large" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTextSize("large")}
                  className="h-10 flex-1"
                >
                  <span className="text-base">Aa</span>
                </Button>
              </div>
            </div>

            {/* Accessibility toggles */}
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <OptionHeader icon={Volume2} title="Screen reader" />
                <button
                  onClick={toggleScreenReader}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                    screenReader ? "bg-primary" : "bg-muted"
                  }`}
                  role="switch"
                  aria-checked={screenReader}
                  aria-label="Toggle screen reader mode"
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      screenReader ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between gap-3">
                <OptionHeader icon={ZoomIn} title="Magnifier" />
                <button
                  onClick={toggleMagnifier}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                    magnifier ? "bg-primary" : "bg-muted"
                  }`}
                  role="switch"
                  aria-checked={magnifier}
                  aria-label="Toggle magnifier"
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      magnifier ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>

            <Separator />

            {/* Editor */}
            <div className="space-y-5">
              <div className="flex items-center gap-2">
                <Code className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="text-sm font-semibold">Editor</span>
              </div>

              <div className="space-y-3">
                <OptionHeader
                  icon={Type}
                  title="Font size"
                  description="Code editor (8–32px)"
                />
                <div className="flex items-center gap-3">
                  <Input
                    id="font-size"
                    type="number"
                    min="8"
                    max="32"
                    value={editorFontSize}
                    onChange={handleFontSizeChange}
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">px</span>
                  <div className="min-w-0 flex-1">
                    <input
                      type="range"
                      min="8"
                      max="32"
                      value={editorFontSize}
                      onChange={(e) =>
                        setEditorFontSize(parseInt(e.target.value, 10))
                      }
                      className="h-2 w-full cursor-pointer accent-primary"
                      aria-label="Editor font size"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <OptionHeader
                  icon={Hash}
                  title="Line numbers"
                  description="In the source editor"
                />
                <button
                  id="line-numbers"
                  onClick={toggleLineNumbers}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                    showLineNumbers ? "bg-primary" : "bg-muted"
                  }`}
                  role="switch"
                  aria-checked={showLineNumbers}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      showLineNumbers ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}
