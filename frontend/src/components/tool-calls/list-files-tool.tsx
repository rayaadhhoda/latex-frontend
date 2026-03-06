import { useRenderToolCall } from "@copilotkit/react-core";
import { Tool, ToolContent, ToolHeader, ToolOutput } from "../ai-elements/tool";
import { CodeBlock } from "../ai-elements/code-block";

export default function useRenderListFilesTool() {
  useRenderToolCall({
    name: "list_files_tool",
    description: "list files in the project directory",
    parameters: [],
    render: ({ status, result }) => {
      if (status === "executing") {
        return (
          <Tool>
            <ToolHeader
              state="input-available"
              title="List files"
              type="tool-list_files_tool"
            />
          </Tool>
        );
      }
      if (status === "complete") {
        return (
          <Tool>
            <ToolHeader
              state="output-available"
              title="List files"
              type="tool-list_files_tool"
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
