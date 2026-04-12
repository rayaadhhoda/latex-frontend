import {
  CopilotChatInput,
  CopilotChatInputProps,
  useAgent,
  UseAgentUpdate,
  useCopilotChatConfiguration,
} from "@copilotkit/react-core/v2";
import {
  PromptInput,
  PromptInputBody,
  PromptInputClearChat,
  PromptInputFooter,
  PromptInputHeader,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  PromptInputButton,
  usePromptInputAttachments,
} from "@/components/ui/prompt-input";
import {
  Attachment,
  AttachmentHoverCard,
  AttachmentHoverCardContent,
  AttachmentHoverCardTrigger,
  Attachments,
  AttachmentInfo,
  AttachmentPreview,
  AttachmentRemove,
} from "@/components/ai-elements/attachments";
import { useImageForAIChat } from "@/contexts/image-for-ai-chat-context";
import type { UploadImageData } from "@/api/client";
import { cn } from "@/lib/utils";
import type { FileUIPart } from "ai";
import { ImagePlus } from "lucide-react";
import { useCallback, useMemo } from "react";

const CONTEXT_ATTACHED_ID = "context-attached";

function mimeFromFilename(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".bmp")) return "image/bmp";
  if (lower.endsWith(".svg")) return "image/svg+xml";
  return "application/octet-stream";
}

function uploadDataToFileUIPart(
  data: UploadImageData,
): FileUIPart & { id: string } {
  const mediaType = mimeFromFilename(data.original_filename);
  return {
    type: "file",
    id: CONTEXT_ATTACHED_ID,
    filename: data.original_filename,
    mediaType,
    url: `data:${mediaType};base64,${data.image_bytes}`,
  };
}

function ChatPromptAttachmentsRow() {
  const attachments = usePromptInputAttachments();
  const { uploadedImageData, handleRemoveImage } = useImageForAIChat();

  const displayFiles: (FileUIPart & { id: string })[] = useMemo(() => {
    if (attachments.files.length > 0) {
      return attachments.files;
    }
    if (uploadedImageData) {
      return [uploadDataToFileUIPart(uploadedImageData)];
    }
    return [];
  }, [attachments.files, uploadedImageData]);

  const onRemoveAttachment = useCallback(
    (id: string) => {
      if (attachments.files.some((f) => f.id === id)) {
        attachments.remove(id);
      } else if (id === CONTEXT_ATTACHED_ID) {
        void handleRemoveImage();
      }
    },
    [attachments, handleRemoveImage],
  );

  if (displayFiles.length === 0) {
    return null;
  }

  return (
    <PromptInputHeader>
      <Attachments className="w-full" variant="inline">
        {displayFiles.map((file) => (
          <AttachmentHoverCard key={file.id}>
            <AttachmentHoverCardTrigger asChild>
              <Attachment
                data={file}
                onRemove={() => onRemoveAttachment(file.id)}
              >
                <AttachmentPreview />
                <AttachmentInfo />
                <AttachmentRemove />
              </Attachment>
            </AttachmentHoverCardTrigger>
            <AttachmentHoverCardContent>
              <div className="max-h-64 max-w-sm overflow-hidden rounded-md border bg-muted p-1">
                {file.url ? (
                  <img
                    alt=""
                    className="max-h-60 w-full object-contain"
                    src={file.url}
                  />
                ) : null}
              </div>
            </AttachmentHoverCardContent>
          </AttachmentHoverCard>
        ))}
      </Attachments>
    </PromptInputHeader>
  );
}

function AdaptedInputView(props: CopilotChatInputProps) {
  const {
    onSubmitMessage,
    onStop,
    containerRef,
    className,
    positioning = "static",
    keyboardHeight = 0,
  } = props;

  const config = useCopilotChatConfiguration();
  const { agent } = useAgent({
    agentId: config?.agentId,
    updates: [UseAgentUpdate.OnRunStatusChanged],
  });

  const status = agent.isRunning ? "streaming" : "ready";

  const { syncImageFromPromptFiles, clearAttachmentAfterSend, handleAddImage } =
    useImageForAIChat();

  const handleClearChat = useCallback(() => {
    if (agent.isRunning) {
      onStop?.();
    }
    agent.setMessages([]);
  }, [agent, onStop]);

  const input = (
    <PromptInput
      accept="image/*"
      maxFiles={1}
      multiple={false}
      onSubmit={async (prompt) => {
        const pathForMessage = await syncImageFromPromptFiles(prompt.files);
        await Promise.resolve(onSubmitMessage?.(prompt.text));
        if (pathForMessage) {
          clearAttachmentAfterSend(pathForMessage);
        }
      }}
    >
      <ChatPromptAttachmentsRow />
      <PromptInputBody>
        <PromptInputTextarea placeholder="What can I help you with?" />
      </PromptInputBody>
      <PromptInputFooter className="flex justify-between">
        <PromptInputTools>
          <PromptInputButton
            aria-label="Attach image"
            onClick={() => void handleAddImage()}
            tooltip="Attach image"
            type="button"
          >
            <ImagePlus className="size-4" />
          </PromptInputButton>
        </PromptInputTools>
        <div className="flex items-center gap-1">
          <PromptInputClearChat onClearChat={handleClearChat} status={status} />
          <PromptInputSubmit status={status} onStop={onStop} />
        </div>
      </PromptInputFooter>
    </PromptInput>
  );

  if (positioning !== "absolute") {
    return input;
  }

  return (
    <div
      data-copilotkit
      ref={containerRef}
      className={cn(
        "z-20 min-w-0 w-full shrink-0 pointer-events-none",
        className,
      )}
      style={{
        transform: keyboardHeight > 0 ? `translateY(-${keyboardHeight}px)` : undefined,
        transition: "transform 0.2s ease-out",
      }}
    >
      <div className="pointer-events-auto mx-auto max-w-3xl px-4 sm:px-0 pb-2">
        {input}
      </div>
    </div>
  );
}

export default AdaptedInputView as typeof CopilotChatInput;
