import { useRenderToolCall } from "@copilotkit/react-core";
import { Tool, ToolContent, ToolHeader, ToolInput, ToolOutput } from "../ai-elements/tool";
import { CodeBlock } from "../ai-elements/code-block";

export default function useRenderReadFileTool() {
  useRenderToolCall({
    name: "read_file_tool",
    description: "read a file",
    parameters: [{
      name: "file_path",
      type: "string",
    }],
    render: ({ args: { file_path }, status, result }) => {
      if (status === "executing") {
        return (
          <Tool>
            <ToolHeader
              state="input-available"
              title="Read file"
              type="tool-read_file_tool"
            />
            <ToolContent>
              <ToolInput input={{ file_path }} />
            </ToolContent>
          </Tool>
        );
      }
      if (status === "complete") {
        return (
          <Tool>
            <ToolHeader
              state="output-available"
              title="Read file"
              type="tool-read_file_tool"
            />
            <ToolContent>
              <ToolInput input={{ file_path }} />
              <ToolOutput errorText={undefined} output={
                <CodeBlock code={result} language="latex" />
              } />
            </ToolContent>
          </Tool>
        );
      }

      return <></>;
    },
  });
}
