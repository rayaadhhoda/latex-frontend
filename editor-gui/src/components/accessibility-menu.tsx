import { Eye, Volume2, ZoomIn, X } from "lucide-react";
import { useAccessibility } from "@/contexts/accessibility-context";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface AccessibilityMenuProps {
  onClose: () => void;
}

export default function AccessibilityMenu({ onClose }: AccessibilityMenuProps) {
  const {
    textSize,
    setTextSize,
    highContrast,
    toggleHighContrast,
    screenReader,
    toggleScreenReader,
    magnifier,
    toggleMagnifier,
  } = useAccessibility();

  return (
    <Card className="w-80 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Eye className="h-5 w-5" />
          Accessibility
        </CardTitle>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onClose}
          className="h-6 w-6"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Text Size */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Text Size
          </label>
          <div className="flex gap-2">
            <Button
              variant={textSize === "small" ? "default" : "outline"}
              size="sm"
              onClick={() => setTextSize("small")}
              className="flex-1 h-10"
            >
              <span className="text-xs">Aa</span>
            </Button>
            <Button
              variant={textSize === "medium" ? "default" : "outline"}
              size="sm"
              onClick={() => setTextSize("medium")}
              className="flex-1 h-10"
            >
              <span className="text-sm">Aa</span>
            </Button>
            <Button
              variant={textSize === "large" ? "default" : "outline"}
              size="sm"
              onClick={() => setTextSize("large")}
              className="flex-1 h-10"
            >
              <span className="text-base">Aa</span>
            </Button>
          </div>
        </div>

        {/* Accessibility Options */}
        <div className="space-y-3">
          {/* High Contrast */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Eye className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium">High Contrast</span>
            </div>
            <button
              onClick={toggleHighContrast}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                highContrast ? "bg-primary" : "bg-muted"
              }`}
              role="switch"
              aria-checked={highContrast}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  highContrast ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Screen Reader */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Volume2 className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium">Screen Reader</span>
            </div>
            <button
              onClick={toggleScreenReader}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                screenReader ? "bg-primary" : "bg-muted"
              }`}
              role="switch"
              aria-checked={screenReader}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  screenReader ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Magnifier */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ZoomIn className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium">Magnifier</span>
            </div>
            <button
              onClick={toggleMagnifier}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                magnifier ? "bg-primary" : "bg-muted"
              }`}
              role="switch"
              aria-checked={magnifier}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  magnifier ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
