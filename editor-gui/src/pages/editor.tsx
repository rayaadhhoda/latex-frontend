import { useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import CodeEditor from "@/components/code-editor";
import { EditorProvider, useEditor } from "@/contexts/editor-context";
import TopNavigation from "@/components/top-navigation";
import FileBrowser from "@/components/file-browser";
import AIChat from "@/components/ai-chat";
import PDFView from "@/components/pdf-view";
import { CopilotKit } from "@copilotkit/react-core";

function EditorContent() {
  const { currentFile, compileAndRefresh, loadFile, dir } = useEditor();
  const [activeTab, setActiveTab] = useState<"preview" | "source">("preview");
  const prevInProgressRef = useRef<boolean>(false);

  const handleInProgress = (inProgress: boolean) => {
    // When inProgress changes from true to false, agent has completed responding
    if (prevInProgressRef.current && !inProgress) {
      // Agent just finished responding, fetch PDF and update preview
      compileAndRefresh();
    }
    prevInProgressRef.current = inProgress;
  };

  return (
    <CopilotKit
      runtimeUrl="http://localhost:8765/copilotkit"
      agent="0"
      properties={{ folder_path: dir }}
      showDevConsole={false}>
      <div className="flex flex-col h-screen overflow-hidden">
        {/* Top Navigation */}
        <TopNavigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onCompile={compileAndRefresh}
        />

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

          {/* Center Panel */}
          <div className="flex-1 flex flex-col border-r">
            {activeTab === "source" ? <CodeEditor /> : <PDFView />}
          </div>

          {/* Right Sidebar - AI Assistant */}
          <div className="w-80 shrink-0">
            <AIChat onInProgress={handleInProgress} />
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
      <EditorContent />
    </EditorProvider>
  );
}
