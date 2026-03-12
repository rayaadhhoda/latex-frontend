import { useFrontendTool } from "@copilotkit/react-core";
import { Tool, ToolContent, ToolHeader, ToolOutput } from "../ai-elements/tool";
import { CodeBlock } from "../ai-elements/code-block";
import { compileProject } from "@/api/client";

export default function useCompileProjectTool(dir: string) {
  useFrontendTool({
    name: "compile_latex_tool",
    description: "Compile the LaTeX project.",
    parameters: [],
    handler: async () => {
      try {
        const res = await compileProject(dir);
        if (res.success) return "SUCCESS";
        return `FAILED: ${res.data?.stderr ?? "Unknown error"}`;
      } catch (e) {
        return `Error compiling: ${e instanceof Error ? e.message : String(e)}`;
      }
    },
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
