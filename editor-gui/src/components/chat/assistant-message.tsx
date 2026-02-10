import type { AssistantMessageProps } from "@copilotkit/react-ui";
import { CopyIcon, LoaderIcon, RefreshCwIcon, ThumbsDownIcon, ThumbsUpIcon } from "lucide-react";
import { useState } from "react";

import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";

export function CustomAssistantMessage({
  message,
  isLoading,
  isCurrentMessage,
  onRegenerate,
  onCopy,
  onThumbsUp,
  onThumbsDown,
  feedback,
}: AssistantMessageProps) {
  const [copied, setCopied] = useState(false);
  const content = message?.content ?? "";
  const subComponent = message?.generativeUI?.();

  const handleCopy = () => {
    if (!content) return;
    navigator.clipboard.writeText(content);
    setCopied(true);
    onCopy?.(content);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Message from="assistant">
      {subComponent && <div>{subComponent}</div>}

      {content ? (
        <MessageContent>
          <MessageResponse>{content}</MessageResponse>
        </MessageContent>
      ) : isLoading ? (
        <MessageContent>
          <LoaderIcon className="size-4 animate-spin text-muted-foreground" />
        </MessageContent>
      ) : null}

      {content && !isLoading && isCurrentMessage && (
        <MessageActions>
          {onRegenerate && (
            <MessageAction tooltip="Regenerate" onClick={onRegenerate}>
              <RefreshCwIcon className="size-3.5" />
            </MessageAction>
          )}
          <MessageAction tooltip={copied ? "Copied!" : "Copy"} onClick={handleCopy}>
            <CopyIcon className="size-3.5" />
          </MessageAction>
          {onThumbsUp && (
            <MessageAction
              tooltip="Good response"
              onClick={() => message && onThumbsUp(message)}
              variant={feedback === "thumbsUp" ? "secondary" : "ghost"}
            >
              <ThumbsUpIcon className="size-3.5" />
            </MessageAction>
          )}
          {onThumbsDown && (
            <MessageAction
              tooltip="Bad response"
              onClick={() => message && onThumbsDown(message)}
              variant={feedback === "thumbsDown" ? "secondary" : "ghost"}
            >
              <ThumbsDownIcon className="size-3.5" />
            </MessageAction>
          )}
        </MessageActions>
      )}
    </Message>
  );
}
