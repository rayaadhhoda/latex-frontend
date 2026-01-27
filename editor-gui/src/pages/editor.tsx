import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CodeEditor from "@/components/code-editor";
import AIChat from "@/components/ai-chat";
import { EditorProvider } from "@/contexts/editor-context";
import PDFView from "@/components/pdf-view";


export default function Editor() {
  const [searchParams] = useSearchParams();
  const dir = searchParams.get("dir");

  return (
    <EditorProvider dir={dir}>
      <div className="flex h-screen">
        {/* Left Panel - Chat & Code Tabs */}
        <div className="w-1/3 flex flex-col border-r">
          <Tabs defaultValue="chat" className="flex flex-col h-full">
            <div className="p-2 border-b">
              <TabsList>
                <TabsTrigger value="chat">Chat</TabsTrigger>
                <TabsTrigger value="code">Source</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="chat" className="flex-1 p-4 m-0">
              <AIChat />
            </TabsContent>
            <TabsContent value="code" className="flex-1 p-4 m-0">
              <CodeEditor />
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Panel - PDF Viewer */}
        <div className="w-2/3 flex items-center justify-center bg-muted/30">
          <PDFView />
        </div>
      </div>
    </EditorProvider>
  );
}
