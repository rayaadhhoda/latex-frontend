import { useRenderToolCall } from "@copilotkit/react-core";
import { Tool, ToolContent, ToolHeader, ToolOutput } from "../ai-elements/tool";
import { CodeBlock } from "../ai-elements/code-block";

export default function useRenderMoveAttachedImageToProjectTool() {
  useRenderToolCall({
    name: "move_attached_image_to_project_tool",
    description: "Move attached image to project figures directory",
    parameters: [],
    render: ({ status, result }) => {
      if (status === "executing") {
        return (
          <Tool>
            <ToolHeader
              state="input-available"
              title="Move attached image to project"
              type="tool-move_attached_image_to_project_tool"
            />
          </Tool>
        );
      }
      if (status === "complete") {
        return (
          <Tool>
            <ToolHeader
              state="output-available"
              title="Move attached image to project"
              type="tool-move_attached_image_to_project_tool"
            />
            <ToolContent>
              <ToolOutput errorText={undefined} output={
                <CodeBlock code={result} language="markdown" />
              } />
            </ToolContent>
          </Tool>
        );
      }

      return <></>;
    },
  });
}
