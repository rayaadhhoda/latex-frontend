import { useMemo, useState, useRef, type KeyboardEvent } from "react";
import type { InputProps } from "@copilotkit/react-ui";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Paperclip, Send, Square } from "lucide-react";

export function AIChatInput({
  inProgress,
  onSend,
  chatReady = false,
  onStop,
  onUpload,
  hideStopButton = false,
}: InputProps) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const canSend = useMemo(
    () => !inProgress && text.trim().length > 0,
    [inProgress, text],
  );

  const canStop = useMemo(
    () => inProgress && !hideStopButton,
    [inProgress, hideStopButton],
  );

  const sendDisabled = !canSend && !canStop;

  const handleSend = async () => {
    if (!canSend && !canStop) return;

    if (canStop && onStop) {
      onStop();
      return;
    }

    const trimmed = text.trim();
    if (!trimmed) return;
    setText("");
    textareaRef.current?.focus();
    await onSend(trimmed);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (canSend) {
        void handleSend();
      }
    }
  };

  return (
    <div className="mt-2 bg-background/95 px-3 pb-3 pt-2">
      <div className="rounded-lg border bg-background/90 px-2.5 py-2 shadow-sm">
        <Textarea
          ref={textareaRef}
          rows={1}
          className={cn(
            "max-h-32 min-h-0 w-full resize-none border-0 bg-transparent p-0 text-xs shadow-none",
            "focus-visible:ring-0",
          )}
          placeholder={
            chatReady
              ? "Type a message…"
              : "Connecting to assistant…"
          }
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        <div className="mt-1 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {onUpload && (
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="h-7 w-7"
                onClick={onUpload}
                title="Attach image or file"
              >
                <Paperclip className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>

          <Button
            type="button"
            size="icon-xs"
            variant={inProgress ? "outline" : "default"}
            disabled={sendDisabled}
            className="h-7 w-7"
            onClick={handleSend}
            title={inProgress && !hideStopButton ? "Stop" : "Send"}
          >
            {inProgress && !hideStopButton ? (
              <Square className="h-3.5 w-3.5" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

