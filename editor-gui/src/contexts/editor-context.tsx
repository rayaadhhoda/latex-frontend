import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
  useEffect,
} from "react";
import { compileProject, getPDF, initProject, listFiles } from "@/api/client";

interface EditorContextValue {
  dir: string | null;
  files: string[];
  pdf: Uint8Array | null;
  loading: boolean;
  error: string | null;
  refreshFiles: () => Promise<void>;
}

const EditorContext = createContext<EditorContextValue | null>(null);

interface EditorProviderProps {
  dir: string | null;
  children: ReactNode;
}

export function EditorProvider({ dir, children }: EditorProviderProps) {
  const [files, setFiles] = useState<string[]>([]);
  const [pdf, setPdf] = useState<Uint8Array | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshFiles = useCallback(async () => {
    if (!dir) return;

    try {
      const response = await listFiles(dir);
      if (response.success && response.data) {
        setFiles(response.data.files);
      } else {
        setError(response.detail || "Failed to load files");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load files");
    }

    if (!files.includes("main.tex")) {
      await initProject(dir, "default");

      // re-list files after init
      const response = await listFiles(dir);
      if (response.success && response.data) {
        setFiles(response.data.files);
      } else {
        setError(response.detail || "Failed to load files");
      }
    }

    try {
      await compilePDF();
      const bytes = await getPDF(dir);
      setPdf(bytes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to compile PDF");
    }
  }, [dir]);

  const compilePDF = useCallback(async () => {
    if (!dir) return;

    try {
      await compileProject(dir);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to compile PDF");
    }
  }, [dir]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    (async () => {
      try {
        await refreshFiles();
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Failed to refresh files");
      } finally {
        setLoading(false);
      }
    })();
  }, [dir, refreshFiles]);

  const value: EditorContextValue = {
    dir,
    files,
    pdf,
    loading,
    error,
    refreshFiles,
  };

  return (
    <EditorContext.Provider value={value}>{children}</EditorContext.Provider>
  );
}

export function useEditor() {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error("useEditor must be used within EditorProvider");
  }
  return context;
}
