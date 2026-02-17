import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
  useEffect,
} from "react";
import { compileProject, getPDF, listFiles, getFileContent, updateFileContent } from "@/api/client";

interface EditorContextValue {
  dir: string | null;
  files: string[];
  pdf: Uint8Array | null;
  loading: boolean;
  error: string | null;
  currentFile: string | null;
  fileContent: string | null;
  refreshFiles: () => Promise<void>;
  loadFile: (file: string) => Promise<void>;
  saveFile: (content: string) => Promise<void>;
  compileAndRefresh: () => Promise<void>;
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
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);

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

  const loadFile = useCallback(async (file: string) => {
    if (!dir) return;

    try {
      setLoading(true);
      const response = await getFileContent(dir, file);
      if (response.success && response.data) {
        setCurrentFile(file);
        setFileContent(response.data.content);
      } else {
        setError(response.detail || "Failed to load file");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load file");
    } finally {
      setLoading(false);
    }
  }, [dir]);

  const saveFile = useCallback(async (content: string) => {
    if (!dir || !currentFile) return;

    try {
      await updateFileContent(dir, currentFile, content);
      setFileContent(content);
      // Optionally refresh files list
      await refreshFiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save file");
      throw err;
    }
  }, [dir, currentFile, refreshFiles]);

  const compileAndRefresh = useCallback(async () => {
    if (!dir) return;

    try {
      setLoading(true);
      await compilePDF();
      const bytes = await getPDF(dir);
      setPdf(bytes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to compile PDF");
    } finally {
      setLoading(false);
    }
  }, [dir, compilePDF]);

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

  // Auto-load main.tex when files are loaded
  useEffect(() => {
    if (files.length > 0 && !currentFile && files.includes("main.tex")) {
      loadFile("main.tex");
    }
  }, [files, currentFile, loadFile]);

  const value: EditorContextValue = {
    dir,
    files,
    pdf,
    loading,
    error,
    currentFile,
    fileContent,
    refreshFiles,
    loadFile,
    saveFile,
    compileAndRefresh,
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
