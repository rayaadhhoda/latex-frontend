import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { useAccessibility } from "@/contexts/accessibility-context";
import { useEditor } from "@/contexts/editor-context";
import PdfPageIndicator from "@/components/pdf-page-indicator";
import { PdfZoomButtonGroup } from "@/components/pdf-zoom-button-group";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

const MAIN_PDF = "main.pdf" as const;

export default function PDFView() {
  const { pdfZoomPercent } = useAccessibility();
  const { pdf, files, pdfPreviewPageRef } = useEditor();
  const mainPdfExists = useMemo(() => files.includes(MAIN_PDF), [files]);

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>();
  const [numPages, setNumPages] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(pdfPreviewPageRef.current);

  const scrollToPageRef = useRef<number | null>(null);
  const [scrollPending, setScrollPending] = useState(false);
  const pageWrapperRefs = useRef<(HTMLDivElement | null)[]>([]);

  // PDF.js transfers `data.buffer` to the worker, detaching it. A memoized `{ data: slice() }`
  // would reuse a detached buffer after the first load. Load via blob URL so the worker reads
  // from a URL stream and the context `pdf` bytes stay valid across remounts.
  const pdfBlobUrl = useMemo(() => {
    if (!pdf) return null;
    return URL.createObjectURL(
      new Blob([new Uint8Array(pdf)], { type: "application/pdf" }),
    );
  }, [pdf]);

  useEffect(() => {
    return () => {
      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
    };
  }, [pdfBlobUrl]);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    setContainerWidth(el.clientWidth);

    let timer: ReturnType<typeof setTimeout>;
    const ro = new ResizeObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        scrollToPageRef.current = pdfPreviewPageRef.current;
        setContainerWidth(el.clientWidth);
      }, 100);
    });
    ro.observe(el);
    return () => {
      clearTimeout(timer);
      ro.disconnect();
    };
  }, [pdf]);

  useEffect(() => {
    const target = pdfPreviewPageRef.current;
    scrollToPageRef.current = target;
    setScrollPending(target > 1);
    setNumPages(null);
    setCurrentPage(target);
  }, [pdf]);

  const handlePageRender = useCallback((pageNumber: number) => {
    if (scrollToPageRef.current === pageNumber) {
      scrollToPageRef.current = null;
      pageWrapperRefs.current[pageNumber - 1]?.scrollIntoView({
        behavior: "instant",
      });
      setScrollPending(false);
    }
  }, []);

  useEffect(() => {
    const root = containerRef.current;
    if (!root || numPages === null) return;

    const ratios = new Map<number, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const page = Number((entry.target as HTMLElement).dataset.page);
          if (page) ratios.set(page, entry.intersectionRatio);
        }
        let bestPage = pdfPreviewPageRef.current;
        let bestRatio = -1;
        for (const [page, ratio] of ratios) {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestPage = page;
          }
        }
        pdfPreviewPageRef.current = bestPage;
        setCurrentPage(bestPage);
      },
      { root, threshold: [0, 0.25, 0.5, 0.75, 1] },
    );

    for (const el of pageWrapperRefs.current) {
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [numPages]);

  const onDocumentLoadSuccess = useCallback((doc: { numPages: number }) => {
    setNumPages(doc.numPages);
    if (
      scrollToPageRef.current !== null &&
      scrollToPageRef.current > doc.numPages
    ) {
      scrollToPageRef.current = null;
      setScrollPending(false);
    }
  }, []);

  if (!pdf || !pdfBlobUrl) {
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

  const basePageWidth =
    containerWidth !== undefined && containerWidth > 0
      ? Math.max((containerWidth - 40) * 0.92, 1)
      : 0;
  const pageWidth = basePageWidth > 0 ? (basePageWidth * pdfZoomPercent) / 100 : 0;

  return (
    <div className="relative h-full min-h-0 w-full">
      {numPages !== null && !scrollPending && (
        <div className="absolute right-2 top-2 z-10 flex items-center gap-2">
          <div className="w-fit shrink-0 overflow-hidden rounded-md bg-background/85 backdrop-blur-sm">
            <PdfZoomButtonGroup compact />
          </div>
          <PdfPageIndicator currentPage={currentPage} totalPages={numPages} />
        </div>
      )}
      {scrollPending && (
        <div className="bg-background absolute inset-0 z-10 flex items-center justify-center">
          <div className="text-muted-foreground flex items-center gap-2">
            <span
              className="size-5 animate-spin rounded-full border-2 border-current border-t-transparent"
              aria-hidden
            />
            <span>Loading PDF…</span>
          </div>
        </div>
      )}
      <div
        ref={containerRef}
        className="bg-muted/30 h-full w-full overflow-auto"
      >
        <div className="flex flex-col items-center gap-2 px-8 py-2">
          <Document
            className="flex flex-col items-center gap-2"
            file={pdfBlobUrl}
            loading={
              <div className="text-muted-foreground flex min-h-[200px] items-center gap-2">
                <span
                  className="size-5 animate-spin rounded-full border-2 border-current border-t-transparent"
                  aria-hidden
                />
                <span>Loading PDF...</span>
              </div>
            }
            onLoadSuccess={onDocumentLoadSuccess}
          >
            {pageWidth > 0 &&
              numPages !== null &&
              Array.from({ length: numPages }, (_, i) => (
                <div
                  key={i + 1}
                  data-page={i + 1}
                  ref={(el) => {
                    pageWrapperRefs.current[i] = el;
                  }}
                >
                  <Page
                    className="shadow-sm"
                    pageNumber={i + 1}
                    width={pageWidth}
                    renderTextLayer
                    renderAnnotationLayer
                    onRenderSuccess={() => handlePageRender(i + 1)}
                  />
                </div>
              ))}
          </Document>
        </div>
      </div>
    </div>
  );
}
