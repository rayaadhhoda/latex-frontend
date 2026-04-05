type PdfPageIndicatorProps = {
  currentPage: number;
  totalPages: number;
  className?: string;
};

/**
 * Compact readout for PDF scroll position, intended as a top-right overlay on the preview frame.
 */
export default function PdfPageIndicator({
  currentPage,
  totalPages,
  className = "",
}: PdfPageIndicatorProps) {
  return (
    <div
      className={`select-none rounded-md border border-border/60 bg-background/85 px-2.5 py-1 text-xs font-medium tabular-nums text-muted-foreground shadow-sm backdrop-blur-sm ${className}`}
      aria-live="polite"
      aria-label={`PDF page ${currentPage} of ${totalPages}`}
    >
      <span className="text-foreground">{currentPage}</span>
      <span className="mx-0.5 opacity-60">/</span>
      <span>{totalPages}</span>
    </div>
  );
}
