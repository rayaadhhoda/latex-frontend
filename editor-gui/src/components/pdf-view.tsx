import { useEffect, useState } from "react";
import { useEditor } from "@/contexts/editor-context";

const PDF_FILENAME = "main.pdf" as const;

export default function PDFView() {
  const { pdf } = useEditor();
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
      title={`${PDF_FILENAME} Preview`}
    />
  );
}
