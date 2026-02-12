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
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const editorTheme = propTheme || (isDark ? "latexTheme" : "light");

  const editorLanguage = (() => {
    if (!currentFile) return language;
    if (currentFile.endsWith('.bib')) return 'bibtex';
    if (currentFile.endsWith('.tex') || currentFile.endsWith('.sty') || currentFile.endsWith('.cls')) return 'latex';
    return language;
  })();

  useEffect(() => {
    if (fileContent !== null) {
      setLocalContent(fileContent);
    }
  }, [fileContent]);

  const debouncedContent = useDebounce(localContent, 500);

  useEffect(() => {
    if (debouncedContent !== fileContent && debouncedContent !== "" && currentFile) {
      saveFile(debouncedContent)
        .then(() => {
          setSaveStatus("saved");
          if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
          savedTimerRef.current = setTimeout(() => setSaveStatus("idle"), 2000);
        })
        .catch(console.error);
    }
  }, [debouncedContent, fileContent, currentFile, saveFile]);

  useEffect(() => {
    return () => {
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, []);

  const handleChange = (value: string | undefined) => {
    setLocalContent(value || "");
    setSaveStatus("saving");
  };

  const handleEditorWillMount = (monaco: Monaco) => {
    monaco.languages.register({ id: 'latex' });
    monaco.languages.setMonarchTokensProvider('latex', {
      tokenizer: {
        root: [
          [/\\(?:begin|end|section|subsection|cite|ref)/, 'keyword'],
          [/\\(?:[a-zA-Z]+)/, 'type'],
          [/\\[%$&#_{}~^]/, 'type'],
          [/[{}]/, 'delimiter'],
          [/\$.*?\$/, 'string.math'],
          [/%.*/, 'comment'],
        ],
      },
    });

    monaco.languages.register({ id: 'bibtex' });
    monaco.languages.setMonarchTokensProvider('bibtex', {
      ignoreCase: true,
      tokenizer: {
        root: [
          [/@[a-zA-Z]+/, { token: 'keyword', next: '@entry' }],
          [/%/, 'comment'],
        ],
        entry: [
          [/[{]/, { token: 'delimiter', next: '@content' }],
          [/[^ \t\r\n,{]+/, 'variable'],
          [/,/, 'delimiter'],
          ['', '', '@pop'],
        ],
        content: [
          [/[a-zA-Z]+(?=\s*=)/, 'attribute.name'],
          [/=/, 'delimiter'],
          [/[{]/, { token: 'string', next: '@nestedCurly' }],
          [/["]/, { token: 'string', next: '@string' }],
          [/[0-9]+/, 'number'],
          [/,/, 'delimiter'],
          [/[}]/, { token: 'delimiter', next: '@pop' }],
        ],
        nestedCurly: [
          [/[^{}]+/, 'string'],
          [/[{]/, 'string', '@push'],
          [/[}]/, 'string', '@pop'],
        ],
        string: [
          [/[^"]+/, 'string'],
          [/["]/, { token: 'string', next: '@pop' }],
        ],
      },
    });

    monaco.editor.defineTheme('latexTheme', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: 'C586C0', fontStyle: 'bold' },
        { token: 'type', foreground: '4EC9B0' },
        { token: 'comment', foreground: '6A9955' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'string.math', foreground: 'DCDCAA' },
        { token: 'attribute.name', foreground: '9CDCFE' },
        { token: 'variable', foreground: '4FC1FF' },
        { token: 'number', foreground: 'B5CEA8' },
      ],
      colors: {},
    });
  };

  const handleEditorDidMount = (editor: any, monaco: Monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
  };

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
          {saveStatus !== "idle" && (
            <span className="text-[10px] text-muted-foreground/60 italic">
              {saveStatus === "saving" ? "saving file..." : "file saved"}
            </span>
          )}
          <div className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border rounded-full text-muted-foreground">
            {currentFile || "No file"}
          </div>
        </div>
      </div>

      <div className="flex-1">
      <Editor
        height="100%"
        language={editorLanguage}
        theme={editorTheme}
        value={localContent}
        onChange={handleChange}
          beforeMount={handleEditorWillMount}
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

    </div>
  );
}
