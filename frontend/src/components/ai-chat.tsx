import {
  CopilotChat,
  useConfigureSuggestions,
} from "@copilotkit/react-core/v2";
import { Fragment, isValidElement } from "react";
import MessageViewAdapter from "./ai-component-adapters/message-view";
import InputViewAdapter from "./ai-component-adapters/input-view";
import ScrollViewAdapter from "./ai-component-adapters/scroll-view";
import SuggestionViewAdapter from "./ai-component-adapters/suggestion-view";
import { useImageForAIChat } from "@/contexts/image-for-ai-chat-context";
import { useEditor } from "@/contexts/editor-context";
import useReadFileTool from "./tool-calls/read-file-tool";
import useListFilesTool from "./tool-calls/list-files-tool";
import useEditFileTool from "./tool-calls/edit-file-tool";
import useDeleteFileTool from "./tool-calls/delete-file-tool";
import useRenameFileTool from "./tool-calls/rename-file-tool";
import useCompileProjectTool from "./tool-calls/compile-project-tool";
import useMoveAttachedImageToProjectTool from "./tool-calls/move-attached-image-to-project-tool";

export default function AIChat() {
  const { dir } = useEditor();
  const { uploadedImageData } = useImageForAIChat();

  useConfigureSuggestions({
    consumerAgentId: "0",
    available: "always",
    suggestions: [
      {
        title: "Add a section",
        message:
          "Add a new section to the document. I'll provide the section name and the location - ask me.",
      },
      {
        title: "Add a subsection",
        message:
          "Add a new subsection to the document under the section I'll provide - ask me.",
      },
      {
        title: "Insert table from photo",
        message:
          "Scan the image and insert the table formatted in LaTeX. Ask me for the image in the next message, and where to insert it.",
      },
      {
        title: "Attach image to the document",
        message:
          "Attach an image to the document. I'll provide the image for use via the move-attached-image-to-project-tool and the location within the doc - ask me.",
      },
    ],
  });

  useReadFileTool(dir ?? "");
  useListFilesTool(dir ?? "");
  useEditFileTool(dir ?? "");
  useDeleteFileTool(dir ?? "");
  useRenameFileTool(dir ?? "");
  useCompileProjectTool(dir ?? "");
  useMoveAttachedImageToProjectTool(dir ?? "", uploadedImageData?.path ?? null);

  return (
    <div className="ai-chat-panel flex h-full min-h-0 min-w-0 w-full flex-col bg-background">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden p-2 mb-2">
        <CopilotChat
          className="flex min-h-0 min-w-0 w-full flex-1 flex-col overflow-hidden"
          welcomeScreen={false}
          messageView={MessageViewAdapter}
          input={InputViewAdapter}
          scrollView={ScrollViewAdapter}
          suggestionView={SuggestionViewAdapter}
          children={(slots) => (
            <div className="relative flex h-full min-h-0 flex-col">
              <div className="min-h-0 flex-1">{slots.scrollView}</div>
              {isValidElement(slots.suggestionView) &&
              slots.suggestionView.type !== Fragment ? (
                <div className="shrink-0 bg-background px-4 py-2 sm:px-0">
                  <div className="mx-auto max-w-3xl">
                    {slots.suggestionView}
                  </div>
                </div>
              ) : null}
              <div className="shrink-0">{slots.input}</div>
            </div>
          )}
        ></CopilotChat>
      </div>
    </div>
  );
}
