import Editor from "@monaco-editor/react";
import { useEditor } from "@/contexts/editor-context";

interface CodeEditorProps {
  language?: string;
  theme?: "vs-dark" | "light";
}

export default function CodeEditor({
  language = "latex",
  theme = "light",
}: CodeEditorProps) {

  return (
    <Editor
      height="100%"
      language={language}
      theme={theme}
      // value={fileContent}
      // onChange={handleChange}
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        lineNumbers: "on",
        wordWrap: "on",
        automaticLayout: true,
        scrollBeyondLastLine: true,
      }}
    />
  );
}
