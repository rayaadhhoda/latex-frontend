import {
  CopilotChatToolCallsView,
  type CopilotChatAssistantMessageProps,
  type CopilotChatMessageViewProps,
  type CopilotChatUserMessageProps,
} from "@copilotkit/react-core/v2";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "../ai-elements/message";

function AdaptedAssistantMessage(props: CopilotChatAssistantMessageProps) {
  const { message } = props;

  return (
    <Message from="assistant">
      <MessageContent>
        <MessageResponse>{message.content}</MessageResponse>
      </MessageContent>
      {message.toolCalls && (
        <CopilotChatToolCallsView message={message} messages={props.messages} />
      )}
    </Message>
  );
}

function AdaptedUserMessage(props: CopilotChatUserMessageProps) {
  const { message } = props;

  return (
    <Message from="user" className="my-4">
      <MessageContent>
        {typeof message.content === "string" && (
          <MessageResponse>{message.content}</MessageResponse>
        )}
        {Array.isArray(message.content) && (
          // FIXME: Implement this
          <pre>{JSON.stringify(message.content, null, 2)}</pre>
        )}
      </MessageContent>
    </Message>
  );
}

export default {
  assistantMessage: AdaptedAssistantMessage,
  userMessage: AdaptedUserMessage,
} as CopilotChatMessageViewProps;
