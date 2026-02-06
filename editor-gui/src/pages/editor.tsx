import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CodeEditor from "@/components/code-editor";
import { EditorProvider, useEditor } from "@/contexts/editor-context";
import TopNavigation from "@/components/top-navigation";
import FileBrowser from "@/components/file-browser";
import AIRefine from "@/components/ai-refine";
import PDFView from "@/components/pdf-view";

function EditorContent() {
  const { currentFile, compileAndRefresh, loadFile } = useEditor();

  return (
    <div className="flex flex-col h-screen">
      {/* Top Navigation */}
      <TopNavigation 
        currentFile={currentFile || undefined}
        onCompile={compileAndRefresh}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Files */}
        <div className="w-64 shrink-0">
          <FileBrowser 
            selectedFile={currentFile}
            onFileSelect={loadFile}
          />
        </div>

        {/* Center Panel - Code Editor */}
        <div className="flex-1 flex flex-col border-r">
          <Tabs defaultValue="preview" className="flex flex-col h-full">
            <div className="p-2 border-b flex items-center">
              <TabsList>
                <TabsTrigger value="preview">PREVIEW</TabsTrigger>
                <TabsTrigger value="source">SOURCE</TabsTrigger>
              </TabsList>
              <a href="#" className="ml-auto text-xs text-muted-foreground hover:underline" onClick={(e) => { e.preventDefault(); }}>
                &gt; Logs
              </a>
            </div>
            <TabsContent value="source" className="flex-1 m-0">
              <CodeEditor />
            </TabsContent>
            <TabsContent value="preview" className="flex-1 m-0">
              <PDFView />
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Sidebar - AI Assistant */}
        <div className="w-80 shrink-0">
          <AIRefine />
        </div>
      </div>
    </div>
  );
}

export default function Editor() {
  const [searchParams] = useSearchParams();
  const dir = searchParams.get("dir");

  return (
    <EditorProvider dir={dir}>
      <EditorContent />
    </EditorProvider>
  );
}
