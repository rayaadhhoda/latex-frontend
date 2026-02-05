import { Settings, X, Type, Hash } from "lucide-react";
import { useSettings } from "@/contexts/settings-context";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SettingsMenuProps {
  onClose: () => void;
}

export default function SettingsMenu({ onClose }: SettingsMenuProps) {
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
    <Card className="w-96 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Settings className="h-5 w-5" />
          Settings
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
        {/* Editor Font Size */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Type className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="font-size" className="text-sm font-medium">
              Editor Font Size
            </Label>
          </div>
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
            <div className="flex-1">
              <input
                type="range"
                min="8"
                max="32"
                value={editorFontSize}
                onChange={(e) => setEditorFontSize(parseInt(e.target.value, 10))}
                className="w-full"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Adjust the font size in the code editor (8-32px)
          </p>
        </div>

        {/* Show Line Numbers */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Hash className="h-5 w-5 text-muted-foreground" />
            <div>
              <Label htmlFor="line-numbers" className="text-sm font-medium">
                Show Line Numbers
              </Label>
              <p className="text-xs text-muted-foreground">
                Display line numbers in the source editor
              </p>
            </div>
          </div>
          <button
            id="line-numbers"
            onClick={toggleLineNumbers}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
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
      </CardContent>
    </Card>
  );
}
