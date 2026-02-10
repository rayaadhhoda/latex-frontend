import type { UserMessageProps } from "@copilotkit/react-ui";

import {
  Message,
  MessageContent,
} from "@/components/ai-elements/message";

/** Extract text from CopilotKit message content (string | ContentPart[]). */
function getTextContent(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .filter((p: any) => p.type === "text")
      .map((p: any) => p.text)
      .join(" ")
      .trim();
  }
  return "";
}

export function CustomUserMessage({ message }: UserMessageProps) {
  const text = getTextContent(message?.content);
  if (!text) return null;

  return (
    <Message from="user">
      <MessageContent>{text}</MessageContent>
    </Message>
  );
}
