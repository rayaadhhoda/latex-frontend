import { CopilotChat } from "@copilotkit/react-ui";

import { CustomAssistantMessage } from "@/components/chat/assistant-message";
import { CustomUserMessage } from "@/components/chat/user-message";
import { AIChatInput } from "@/components/ai-chat-input";

export default function AIChat() {

  return (
    <div className="flex h-full flex-col bg-background/60 backdrop-blur-sm">
      <div className="flex-1 min-h-0 px-2 py-2">
        <CopilotChat
          className="flex h-full flex-col"
          disableSystemMessage
          labels={{
            initial: "How can I help with this project?",
            placeholder: "Add this content to section 1...",
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

