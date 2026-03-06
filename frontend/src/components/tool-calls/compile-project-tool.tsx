import { useRenderToolCall } from "@copilotkit/react-core";
import { Tool, ToolContent, ToolHeader, ToolOutput } from "../ai-elements/tool";
import { CodeBlock } from "../ai-elements/code-block";


export default function useRenderCompileProjectTool() {
  useRenderToolCall({
    name: "compile_latex_tool",
    description: "Compile the project",
    parameters: [],
    render: ({ status, result }) => {
      if (status === "executing") {
        return (
          <Tool>
            <ToolHeader
              state="input-available"
              title="Compile project"
              type="tool-compile_latex_tool"
            />
          </Tool>
        );
      }
      if (status === "complete") {
        return (
          <Tool>
            <ToolHeader
              state="output-available"
              title="Compile project"
              type="tool-compile_latex_tool"
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
