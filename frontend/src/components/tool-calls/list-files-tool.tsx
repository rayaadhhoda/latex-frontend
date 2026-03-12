import { useFrontendTool } from "@copilotkit/react-core";
import { Tool, ToolContent, ToolHeader, ToolOutput } from "../ai-elements/tool";
import { CodeBlock } from "../ai-elements/code-block";
import { listFiles } from "@/api/client";

export default function useListFilesTool(dir: string) {
  useFrontendTool({
    name: "list_files_tool",
    description: "List all files in the project directory.",
    parameters: [],
    handler: async () => {
      try {
        const res = await listFiles(dir);
        const files = res.data?.files;
        if (!files || files.length === 0) return "No files found in the project directory.";
        const fileList = files.map((f: string) => `  - ${f}`).join("\n");
        return `Files in project directory:\n${fileList}`;
      } catch (e) {
        return `Error listing files: ${e instanceof Error ? e.message : String(e)}`;
      }
    },
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
