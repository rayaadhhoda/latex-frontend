import { useState, useEffect, useRef, useCallback } from "react";
import Editor, { Monaco } from "@monaco-editor/react";
import { useEditor } from "@/contexts/editor-context";
import { useTheme } from "@/contexts/theme-context";
import { useSettings } from "@/contexts/settings-context";
import { Bold, Italic, Hash, Heading2, List, Quote, Save, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface CodeEditorProps {
  language?: string;
  theme?: "vs-dark" | "light";
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
      // Reset localContent when file changes or when fileContent updates
      setLocalContent(fileContent);
      setSaveStatus("idle");
    }
  }, [fileContent, currentFile]);

  useEffect(() => {
    return () => {
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, []);

  const handleChange = (value: string | undefined) => {
    setLocalContent(value || "");
  };

  const handleSaveClick = useCallback(async () => {
    if (!currentFile) return;
    try {
      setSaveStatus("saving");
      await saveFile(localContent);
      setSaveStatus("saved");
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
      savedTimerRef.current = setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (err) {
      console.error("Error saving file:", err);
      setSaveStatus("idle");
    }
  }, [currentFile, localContent, saveFile]);

  // Keyboard shortcut: Cmd+S / Ctrl+S
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSaveClick();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleSaveClick]);

  const handleEditorWillMount = (monaco: Monaco) => {
    monaco.languages.register({ id: 'latex' });
    monaco.languages.setMonarchTokensProvider('latex', {
      tokenizer: {
        root: [
          [/\\\\/, 'operator'],  // double backslash (line break) – escape macro highlighting
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
        { token: 'operator', foreground: '9CDCFE' },
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

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
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
    <TooltipProvider delayDuration={600}>
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-1 px-3 py-2 border-b bg-background">
        {([
          { label: "Bold — \\textbf{}", icon: Bold, action: formatBold },
          { label: "Italic — \\textit{}", icon: Italic, action: formatItalic },
          { label: "Section heading", icon: Hash, action: formatHeading },
          { label: "Subsection heading", icon: Heading2, action: formatSubheading },
          { label: "Itemize list", icon: List, action: formatList },
          { label: "Block quote", icon: Quote, action: formatQuote },
        ] as const).map(({ label, icon: Icon, action }) => (
          <Tooltip key={label}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={action}
                className="h-7 w-7"
                aria-label={label}
              >
                <Icon className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{label}</TooltipContent>
          </Tooltip>
        ))}

        <div className="ml-auto flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant={saveStatus === "saved" ? "default" : "outline"}
                className={`h-7 gap-1.5 px-3 text-xs transition-all ${
                  saveStatus === "saved"
                    ? "bg-green-600 hover:bg-green-700 text-white border-transparent"
                    : ""
                }`}
                disabled={!currentFile || saveStatus === "saving"}
                onClick={handleSaveClick}
                aria-label={
                  saveStatus === "saving"
                    ? "Saving file"
                    : saveStatus === "saved"
                    ? "File saved"
                    : "Save file"
                }
              >
                {saveStatus === "saved" ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                {saveStatus === "saving"
                  ? "Saving…"
                  : saveStatus === "saved"
                  ? "Saved"
                  : "Save"}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {saveStatus === "saved" ? "Changes saved" : "Save file (⌘S / Ctrl+S)"}
            </TooltipContent>
          </Tooltip>
          <div
            className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border rounded-full text-muted-foreground max-w-[180px] truncate"
            title={currentFile || "No file"}
          >
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
    </TooltipProvider>
  );
}
