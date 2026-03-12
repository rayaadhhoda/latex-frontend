import { useFrontendTool } from "@copilotkit/react-core";
import { Tool, ToolContent, ToolHeader, ToolOutput } from "../ai-elements/tool";
import { CodeBlock } from "../ai-elements/code-block";
import { moveImageToProject } from "@/api/client";

export default function useMoveAttachedImageToProjectTool(dir: string, uploadedImagePath: string | null) {
  useFrontendTool({
    name: "move_attached_image_to_project_tool",
    description: "Move the currently attached image into the project's figures directory.",
    parameters: [],
    handler: async () => {
      if (!uploadedImagePath) return "Error: No image is currently attached.";
      try {
        const res = await moveImageToProject(uploadedImagePath, dir);
        return `Moved attached image to '${res.data?.moved_path}'.`;
      } catch (e) {
        return `Error moving attached image into project: ${e instanceof Error ? e.message : String(e)}`;
      }
    },
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
