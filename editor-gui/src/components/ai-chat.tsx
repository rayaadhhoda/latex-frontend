import { useCoAgent } from "@copilotkit/react-core";
import { CopilotChat } from "@copilotkit/react-ui";

import { CustomAssistantMessage } from "@/components/chat/assistant-message";
import { CustomUserMessage } from "@/components/chat/user-message";
import { AIChatInput } from "@/components/ai-chat-input";

type AgentState = {
  messages: any[];
};

export default function AIChat() {
  const { state, nodeName, running, threadId } = useCoAgent<AgentState>({
    name: "0",
    initialState: { messages: [] },
  });

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
        <div className="flex flex-col items-end gap-1 text-right">
          <div className="flex items-center gap-1">
            <span
              className={`h-2 w-2 rounded-full ${
                running ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/50"
              }`}
            />
            <span className="text-[11px] font-medium text-muted-foreground">
              {running ? "Thinking…" : "Ready"}
            </span>
          </div>
          <span className="text-[10px] tabular-nums text-muted-foreground/70">
            {state?.messages?.length ?? 0} messages · {nodeName}
            {threadId ? ` · ${threadId.slice(0, 8)}` : ""}
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

