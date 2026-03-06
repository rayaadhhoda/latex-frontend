import { useEffect, useMemo, useState } from "react";
import { useEditor } from "@/contexts/editor-context";

const MAIN_PDF = "main.pdf" as const;

export default function PDFView() {
  const { pdf, files } = useEditor();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!pdf) {
      setPdfUrl(null);
      return;
    }

    const blob = new Blob([pdf.buffer as ArrayBuffer], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    setPdfUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [pdf]);

  const mainPdfExists = useMemo(() => files.includes(MAIN_PDF), [files]);

  if (!pdfUrl) {
    return (
      <div className="flex h-full items-center justify-center">
        {mainPdfExists ? (
          <div className="text-muted-foreground flex items-center gap-2">
            <span className="size-5 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
            <span>Loading PDF…</span>
          </div>
        ) : (
          <p className="text-muted-foreground">No PDF available</p>
        )}
      </div>
    );
  }

  return (
    <iframe
      src={pdfUrl}
      className="h-full w-full border-0"
      title={`${MAIN_PDF} Preview`}
    />
  );
}
