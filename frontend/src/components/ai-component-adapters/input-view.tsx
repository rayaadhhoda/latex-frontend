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
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ui/prompt-input";
import { cn } from "@/lib/utils";

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

  const input = (
    <PromptInput
      maxFiles={0}
      onSubmit={(prompt) => onSubmitMessage?.(prompt.text)}
    >
      <PromptInputBody>
        <PromptInputTextarea placeholder="What can I help you with?" />
      </PromptInputBody>
      <PromptInputFooter>
        <PromptInputSubmit status={status} onStop={onStop} />
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
        "absolute bottom-0 left-0 right-0 z-20 min-w-0 pointer-events-none",
        className,
      )}
      style={{
        transform: keyboardHeight > 0 ? `translateY(-${keyboardHeight}px)` : undefined,
        transition: "transform 0.2s ease-out",
      }}
    >
      <div className="pointer-events-auto mx-auto max-w-3xl px-4 sm:px-0">
        {input}
      </div>
    </div>
  );
}

export default AdaptedInputView as typeof CopilotChatInput;
