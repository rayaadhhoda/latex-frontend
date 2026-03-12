import { Tool, ToolContent, ToolHeader, ToolInput, ToolOutput } from "../ai-elements/tool";
import { CodeBlock } from "../ai-elements/code-block";
import { updateFileContent } from "@/api/client";
import { useFrontendTool } from "@copilotkit/react-core";

export default function useEditFileTool(dir: string) {
  useFrontendTool({
    name: "edit_file_tool",
    description: "Edit or create a file in the project directory.",
    parameters: [{
      name: "file_path",
      type: "string",
      description: "Relative path to the file from the project root (e.g., 'main.tex' or 'refs.bib')",
    }, {
      name: "content",
      type: "string",
      description: "The complete content to write to the file",
    }],
    handler: async ({ file_path, content }) => {
      try {
        const res = await updateFileContent(dir, file_path, content);
        return res.data?.message ?? `Successfully updated '${file_path}'.`;
      } catch (e) {
        return `Error writing to file '${file_path}': ${e instanceof Error ? e.message : String(e)}`;
      }
    },
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
