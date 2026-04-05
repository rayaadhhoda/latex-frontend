import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import {
  PDF_ZOOM_DEFAULT,
  PDF_ZOOM_MAX,
  PDF_ZOOM_MIN,
  PDF_ZOOM_STEP,
  useAccessibility,
} from "@/contexts/accessibility-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PdfZoomButtonGroupProps = {
  className?: string;
  /** Smaller controls for the PDF overlay toolbar */
  compact?: boolean;
};

export function PdfZoomButtonGroup({
  className,
  compact,
}: PdfZoomButtonGroupProps) {
  const { pdfZoomPercent, setPdfZoomPercent, stepPdfZoom } =
    useAccessibility();
  const [zoomDraft, setZoomDraft] = useState<string | null>(null);

  const zoomDisplay = zoomDraft !== null ? zoomDraft : String(pdfZoomPercent);

  const commitZoomFromInput = () => {
    if (zoomDraft === null) return;
    if (zoomDraft === "") {
      setPdfZoomPercent(PDF_ZOOM_DEFAULT);
    } else {
      const n = parseInt(zoomDraft, 10);
      if (!Number.isNaN(n)) setPdfZoomPercent(n);
    }
    setZoomDraft(null);
  };

  const inputWidthCh = Math.max(2, zoomDisplay.length);

  const segmentBtn =
    "rounded-none border-0 bg-background shadow-none hover:bg-accent dark:hover:bg-input/50 focus-visible:z-10 focus-visible:relative";

  return (
    <div
      role="group"
      className={cn(
        "border-input bg-background dark:bg-input/30 inline-flex items-stretch overflow-hidden rounded-md border",
        compact ? "shrink-0" : "w-full min-w-0",
        className,
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size={compact ? "icon-xs" : "icon-sm"}
        className={cn(segmentBtn, "border-r border-input")}
        aria-label="Zoom out"
        disabled={pdfZoomPercent <= PDF_ZOOM_MIN}
        onClick={() => {
          setZoomDraft(null);
          stepPdfZoom(-PDF_ZOOM_STEP);
        }}
      >
        <Minus className={compact ? "size-3.5" : "size-4"} />
      </Button>
      <div
        className={cn(
          "border-input bg-background dark:bg-input/30 flex items-center justify-center gap-0.5 border-r tabular-nums",
          compact ? "h-6 shrink-0 px-1.5" : "min-h-8 min-w-0 flex-1 px-2",
        )}
      >
        <input
          type="text"
          inputMode="numeric"
          aria-label="PDF zoom percent"
          style={{ width: `${inputWidthCh}ch` }}
          className={cn(
            "text-foreground placeholder:text-muted-foreground box-border border-0 bg-transparent p-0 text-center shadow-none outline-none focus-visible:ring-0",
            compact ? "text-xs" : "text-sm md:text-sm",
          )}
          value={zoomDisplay}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, "");
            setZoomDraft(digits === "" ? "" : digits);
          }}
          onFocus={() => setZoomDraft(String(pdfZoomPercent))}
          onBlur={commitZoomFromInput}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.currentTarget.blur();
            }
          }}
        />
        <span
          className="text-muted-foreground pointer-events-none shrink-0 select-none"
          aria-hidden
        >
          %
        </span>
      </div>
      <Button
        type="button"
        variant="ghost"
        size={compact ? "icon-xs" : "icon-sm"}
        className={segmentBtn}
        aria-label="Zoom in"
        disabled={pdfZoomPercent >= PDF_ZOOM_MAX}
        onClick={() => {
          setZoomDraft(null);
          stepPdfZoom(PDF_ZOOM_STEP);
        }}
      >
        <Plus className={compact ? "size-3.5" : "size-4"} />
      </Button>
    </div>
  );
}
