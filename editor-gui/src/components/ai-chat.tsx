import { useCoAgent } from "@copilotkit/react-core";
import { CopilotChat } from "@copilotkit/react-ui";

import { CustomAssistantMessage } from "@/components/chat/assistant-message";
import { CustomUserMessage } from "@/components/chat/user-message";

type AgentState = {
  messages: any[];
};

export default function AIChat() {
  const { state, nodeName, running, threadId } = useCoAgent<AgentState>({
    name: "0",
    initialState: { messages: [] },
  });

  return (
    <div className="flex flex-col h-full">
      {/* Agent state panel */}
      <div className="px-3 py-2 border-b bg-muted/40 space-y-1.5 text-xs">
        <div className="flex items-center gap-2">
          <div
            className={`w-1.5 h-1.5 rounded-full ${running ? "bg-green-500 animate-pulse" : "bg-muted-foreground/40"}`}
          />
          <span className="font-medium text-foreground">
            {running ? "Running" : "Idle"}
          </span>

          <span className="ml-auto text-muted-foreground font-mono">
            Node: {nodeName}
          </span>
        </div>
        <div className="flex items-center gap-3 text-muted-foreground">
          {threadId && <span>thread: {threadId.slice(0, 8)}</span>}
          <span>msgs: {state?.messages?.length ?? 0}</span>
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 min-h-0 overflow-y-auto p-2">
        {/* TODO: Add errors and custom labels */}
        <CopilotChat
          disableSystemMessage
          // labels={{ initial: "Hi, I'm an agent. Want to chat?" }}
          AssistantMessage={CustomAssistantMessage}
          UserMessage={CustomUserMessage}
        />
      </div>
    </div>
  );
}
