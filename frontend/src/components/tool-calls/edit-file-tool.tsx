import { useRenderToolCall } from "@copilotkit/react-core";
import { Tool, ToolContent, ToolHeader, ToolInput, ToolOutput } from "../ai-elements/tool";
import { CodeBlock } from "../ai-elements/code-block";

export default function useRenderEditFileTool() {
  useRenderToolCall({
    name: "edit_file_tool",
    description: "Edit or create a file",
    parameters: [{
      name: "file_path",
      type: "string",
    }, {
      name: "content",
      type: "string",
    }],
    render: ({ args: { file_path, content }, status, result }) => {
      if (status === "executing") {
        return (
          <Tool>
            <ToolHeader
              state="input-available"
              title="Edit file"
              type="tool-edit_file_tool"
            />
            <ToolContent>
              <ToolInput input={{ file_path, content }} />
            </ToolContent>
          </Tool>
        );
      }
      if (status === "complete") {
        return (
          <Tool>
            <ToolHeader
              state="output-available"
              title="Edit file"
              type="tool-edit_file_tool"
            />
            <ToolContent>
              <ToolInput input={{ file_path, content }} />
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
