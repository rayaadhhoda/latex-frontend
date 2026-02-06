import { useState, useEffect, useRef } from "react";
import Editor, { Monaco } from "@monaco-editor/react";
import { useEditor } from "@/contexts/editor-context";
import { useTheme } from "@/contexts/theme-context";
import { useSettings } from "@/contexts/settings-context";
import { Bold, Italic, Hash, Heading2, List, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CodeEditorProps {
  language?: string;
  theme?: "vs-dark" | "light";
}

// Simple debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function CodeEditor({
  language = "latex",
  theme: propTheme,
}: CodeEditorProps) {
  const { fileContent, currentFile, saveFile, loading } = useEditor();
  const { isDark } = useTheme();
  const { editorFontSize, showLineNumbers } = useSettings();
  const [localContent, setLocalContent] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<Monaco | null>(null);
  
  // Use theme from context, fallback to prop
  const editorTheme = propTheme || (isDark ? "vs-dark" : "light");

  // Update local content when file content changes
  useEffect(() => {
    if (fileContent !== null) {
      setLocalContent(fileContent);
    }
  }, [fileContent]);

  // Debounce auto-save
  const debouncedContent = useDebounce(localContent, 1000);

  useEffect(() => {
    if (debouncedContent !== fileContent && debouncedContent !== "" && currentFile) {
      setIsSaving(true);
      saveFile(debouncedContent)
        .catch(console.error)
        .finally(() => setIsSaving(false));
    }
  }, [debouncedContent, fileContent, currentFile, saveFile]);

  const handleChange = (value: string | undefined) => {
    setLocalContent(value || "");
    // Calculate word count (simple - count words in text, excluding LaTeX commands)
    const text = value || "";
    const words = text
      .replace(/\\[a-zA-Z]+\{([^}]*)\}/g, "$1") // Extract text from LaTeX commands
      .replace(/\\[a-zA-Z]+/g, "") // Remove LaTeX commands
      .replace(/[{}[\]]/g, " ") // Replace LaTeX brackets with spaces
      .split(/\s+/)
      .filter((w) => w.length > 0);
    setWordCount(words.length);
  };

  const handleEditorDidMount = (editor: any, monaco: Monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
  };

  // Update editor options when settings change
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions({
        fontSize: editorFontSize,
        lineNumbers: showLineNumbers ? "on" : "off",
        language: 'tex',
      });
    }
  }, [editorFontSize, showLineNumbers]);

  const insertText = (before: string, after: string = "") => {
    const editor = editorRef.current;
    if (!editor) return;

    const selection = editor.getSelection();
    const selectedText = editor.getModel()?.getValueInRange(selection) || "";
    const text = before + selectedText + after;

    editor.executeEdits("formatting", [
      {
        range: selection,
        text: text,
      },
    ]);

    // Restore selection
    if (selectedText) {
      const newStart = {
        lineNumber: selection.startLineNumber,
        column: selection.startColumn + before.length,
      };
      const newEnd = {
        lineNumber: selection.endLineNumber,
        column: selection.startColumn + before.length + selectedText.length,
      };
      editor.setSelection({
        startLineNumber: newStart.lineNumber,
        startColumn: newStart.column,
        endLineNumber: newEnd.lineNumber,
        endColumn: newEnd.column,
      });
    } else {
      const newPos = {
        lineNumber: selection.startLineNumber,
        column: selection.startColumn + before.length,
      };
      editor.setPosition(newPos);
    }

    editor.focus();
  };

  const formatBold = () => insertText("\\textbf{", "}");
  const formatItalic = () => insertText("\\textit{", "}");
  const formatHeading = () => insertText("\\section{", "}");
  const formatSubheading = () => insertText("\\subsection{", "}");
  const formatList = () => insertText("\\begin{itemize}\n\\item ", "\n\\end{itemize}");
  const formatQuote = () => insertText("\\begin{quote}\n", "\n\\end{quote}");

  if (loading && !fileContent) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading file...</p>
      </div>
    );
  }

  if (!currentFile) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No file selected</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {isSaving && (
        <div className="px-4 py-1 text-xs text-muted-foreground bg-muted border-b">
          Saving...
        </div>
      )}
      
      {/* Formatting Toolbar */}
      <div className="flex items-center gap-1 px-3 py-2 border-b bg-background">
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={formatBold}
          className="h-7 w-7"
          title="Bold"
        >
          <Bold className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={formatItalic}
          className="h-7 w-7"
          title="Italic"
        >
          <Italic className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={formatHeading}
          className="h-7 w-7"
          title="Section"
        >
          <Hash className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={formatSubheading}
          className="h-7 w-7"
          title="Subsection"
        >
          <Heading2 className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={formatList}
          className="h-7 w-7"
          title="List"
        >
          <List className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={formatQuote}
          className="h-7 w-7"
          title="Quote"
        >
          <Quote className="h-3.5 w-3.5" />
        </Button>
        
        <div className="ml-auto flex items-center gap-2">
          <div className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border rounded-full text-muted-foreground">
            LaTeX Syntax
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1">
      <Editor
        height="100%"
        language={language}
        theme={editorTheme}
        value={localContent}
        onChange={handleChange}
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: false },
          fontSize: editorFontSize,
          lineNumbers: showLineNumbers ? "on" : "off",
          wordWrap: "on",
          automaticLayout: true,
          scrollBeyondLastLine: true,
        }}
      />
      </div>

      {/* Footer with word count */}
      <div className="px-4 py-1.5 border-t bg-background flex items-center justify-between text-xs text-muted-foreground">
        <span>SJSU Academic Instance</span>
        <span>Words: {wordCount}</span>
      </div>
    </div>
  );
}
