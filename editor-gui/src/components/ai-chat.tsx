import { CopilotChat, CopilotChatSuggestionView } from "@copilotkit/react-core/v2";
import { useImageForAIChat } from "@/contexts/image-for-ai-chat-context";
import UploadedImageItem from "./uploaded-image-item";
import useRenderReadFileTool from "./tool-calls/read-file-tool";
import useRenderListFilesTool from "./tool-calls/list-files-tool";
import useRenderEditFileTool from "./tool-calls/edit-file-tool";
import useRenderCompileProjectTool from "./tool-calls/compile-project-tool";
import useRenderMoveAttachedImageToProjectTool from "./tool-calls/move-attached-image-to-project-tool";

export default function AIChat() {
  const { uploadedImageData, handleAddImage, handleRemoveImage } = useImageForAIChat();

  useRenderReadFileTool();
  useRenderListFilesTool();
  useRenderEditFileTool();
  useRenderCompileProjectTool();
  useRenderMoveAttachedImageToProjectTool();

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex-1 min-h-0 p-2 mb-2">
        <CopilotChat
          className="flex h-full flex-col"
          welcomeScreen={false}
          disclaimer={() => null}
          suggestionView={<CopilotChatSuggestionView suggestions={[
            {
              'message': 'Message 1',
              'title': 'Title 1',
              'isLoading': false,
            }
          ]} />
          }
          // TODO: Add suggestions
          // suggestionView={{
          //   suggestions: [
          //     {
          //       title: "Title 1",
          //       message: "Message 1",
          //       isLoading: false,
          //     }
          //   ]
          // }}
          input={{
            onAddFile: handleAddImage,
          }}
        />

      </div>
      {uploadedImageData ? (
        <UploadedImageItem imageData={uploadedImageData} onRemove={handleRemoveImage} />
      ) : null}
    </div>
  );
}
