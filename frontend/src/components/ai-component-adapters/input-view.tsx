import {
  CopilotChatInput,
  CopilotChatInputProps,
} from "@copilotkit/react-core/v2";

function AdaptedInputView(props: CopilotChatInputProps) {
  return <CopilotChatInput {...props} />;
}

export default {
  ...AdaptedInputView,
} as typeof CopilotChatInput;
