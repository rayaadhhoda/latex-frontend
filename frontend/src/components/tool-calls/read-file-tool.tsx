import { useFrontendTool } from "@copilotkit/react-core";
import { Tool, ToolContent, ToolHeader, ToolInput, ToolOutput } from "../ai-elements/tool";
import { CodeBlock } from "../ai-elements/code-block";
import { getFileContent } from "@/api/client";

export default function useReadFileTool(dir: string) {
  useFrontendTool({
    name: "read_file_tool",
    description: "Read the contents of a file in the project directory.",
    parameters: [{
      name: "file_path",
      type: "string",
      description: "Relative path to the file from the project root (e.g., 'main.tex' or 'refs.bib')",
    }],
    handler: async ({ file_path }) => {
      try {
        const res = await getFileContent(dir, file_path);
        return res.data?.content ?? `Error: could not read '${file_path}'`;
      } catch (e) {
        return `Error reading file '${file_path}': ${e instanceof Error ? e.message : String(e)}`;
      }
    },
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
