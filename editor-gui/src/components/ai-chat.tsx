import { CopilotChat } from "@copilotkit/react-ui";

import { CustomAssistantMessage } from "@/components/chat/assistant-message";
import { CustomUserMessage } from "@/components/chat/user-message";
import { AIChatInput } from "@/components/ai-chat-input";

export default function AIChat() {

  return (
    <div className="flex h-full flex-col rounded-l-lg border-l bg-background/60 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <div className="flex flex-1 flex-col">
          <span className="text-xs font-semibold tracking-wide text-muted-foreground">
            AI ASSISTANT
          </span>
          <span className="text-xs text-muted-foreground">
            Ask questions about your LaTeX project and files.
          </span>
        </div>
      </div>

      {/* Chat: fills remaining vertical space */}
      <div className="flex-1 min-h-0 px-2 py-2">
        <CopilotChat
          className="flex h-full flex-col"
          disableSystemMessage
          labels={{
            initial: "How can I help with this LaTeX project?",
            placeholder: "",
          }}
          AssistantMessage={CustomAssistantMessage}
          UserMessage={CustomUserMessage}
          Input={AIChatInput}
          imageUploadsEnabled
        />
      </div>
    </div>
  );
}

