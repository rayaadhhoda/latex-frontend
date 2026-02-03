import { useEditor } from "@/contexts/editor-context";
import { CopilotChat } from "@copilotkit/react-ui";

export default function AIChat() {
  const { loading, error } = useEditor();

  if (loading) {
    return <div className="text-muted-foreground">Loading files...</div>;
  }

  if (error) {
    return <div className="text-destructive">Error: {error}</div>;
  }

  return (
    // <></>
    <CopilotChat />
  );
}
