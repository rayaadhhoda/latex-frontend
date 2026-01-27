import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
  useEffect,
} from "react";
import { compileProject, initProject, listFiles } from "@/api/client";

interface EditorContextValue {
  dir: string | null;
  files: string[];
  loading: boolean;
  error: string | null;
  refreshFiles: (controller: AbortController) => Promise<void>;
}

const EditorContext = createContext<EditorContextValue | null>(null);

interface EditorProviderProps {
  dir: string | null;
  children: ReactNode;
}

export function EditorProvider({ dir, children }: EditorProviderProps) {
  const [files, setFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshFiles = useCallback(async (controller: AbortController) => {
    if (!dir) return;

    try {
      const response = await listFiles(dir, { signal: controller.signal });
      if (response.success && response.data) {
        setFiles(response.data.files);
      } else {
        setError(response.detail || "Failed to load files");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load files");
    }

    if (!files.includes("main.tex")) {
      await initProject(dir, "default", { signal: controller.signal });

      // re-list files after init
      const response = await listFiles(dir, { signal: controller.signal });
      if (response.success && response.data) {
        setFiles(response.data.files);
      } else {
        setError(response.detail || "Failed to load files");
      }
    }

    try {
      await compilePDF(controller);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to compile PDF");
    }
  }, [dir]);

  const compilePDF = useCallback(async (controller: AbortController) => {
    if (!dir) return;

    try {
      await compileProject(dir, { signal: controller.signal });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to compile PDF");
    }
  }, [dir]);

  useEffect(() => {
    const controller = new AbortController();

    setLoading(true);
    setError(null);
    (async () => {
      try {
        await refreshFiles(controller);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Failed to refresh files");
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [dir, refreshFiles]);

  const value: EditorContextValue = {
    dir,
    files,
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
