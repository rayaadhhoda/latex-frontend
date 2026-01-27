import { useEffect, useState } from "react";
import { useEditor } from "@/contexts/editor-context";

export default function PDFView() {
  const { pdf, loading, error } = useEditor();
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

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Loading PDF...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  if (!pdfUrl) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">No PDF available</p>
      </div>
    );
  }

  return (
    <iframe
      src={pdfUrl}
      className="h-full w-full border-0"
      title="PDF Preview"
    />
  );
}
