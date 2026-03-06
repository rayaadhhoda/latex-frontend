import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import CodeEditor from "@/components/code-editor";
import { EditorProvider, useEditor } from "@/contexts/editor-context";
import {
  ImageForAIChatProvider,
  useImageForAIChat,
} from "@/contexts/image-for-ai-chat-context";
import TopNavigation from "@/components/top-navigation";
import FileBrowser from "@/components/file-browser";
import AIChat from "@/components/ai-chat";
import PDFView from "@/components/pdf-view";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { CopilotKit } from "@copilotkit/react-core";
import { SERVER_API_BASE_URL } from "@/api/constants";

function EditorContent() {
  const { currentFile, compileAndRefresh, loadFile, dir } = useEditor();
  const { uploadedImageData } = useImageForAIChat();
  const [activeTab, setActiveTab] = useState<"preview" | "source">("preview");

  // TODO: Invoke this when the AI chat is complete
  // const onComplete = () => {
  //   compileAndRefresh();
  // };

  return (
    <CopilotKit
      runtimeUrl={`${SERVER_API_BASE_URL}/copilotkit`}
      agent="0"
      properties={{
        folder_path: dir,
        attached_image_path: uploadedImageData?.path ?? null,
      }}
      showDevConsole={false}>
      <div className="flex flex-col h-screen overflow-hidden">
        <TopNavigation activeTab={activeTab} onTabChange={setActiveTab} onCompile={compileAndRefresh} canCompile={!!dir} />

        {/* Main Content Area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar - Files (source mode only) */}
          {activeTab === "source" && (
            <div className="w-64 shrink-0">
              <FileBrowser
                selectedFile={currentFile}
                onFileSelect={loadFile}
              />
            </div>
          )}

          <div className="flex-1 min-w-0 h-full">
            <ResizablePanelGroup orientation="horizontal" className="h-full">
              <ResizablePanel minSize="45%">
                <div className="h-full min-w-0 min-h-0 flex flex-col border-r">
                  {activeTab === "source" ? <CodeEditor /> : <PDFView />}
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize="30%" minSize="20%" maxSize="55%">
                <div className="h-full min-w-0 min-h-0">
                  <AIChat />
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        </div>
      </div>
    </CopilotKit>
  );
}

export default function Editor() {
  const [searchParams] = useSearchParams();
  const dir = searchParams.get("dir");

  return (
    <EditorProvider dir={dir}>
      <ImageForAIChatProvider>
        <EditorContent />
      </ImageForAIChatProvider>
    </EditorProvider>
  );
}
