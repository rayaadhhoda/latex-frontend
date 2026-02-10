import { useMemo } from "react";
import { Folder, Plus, FolderPlus } from "lucide-react";
import { useEditor } from "@/contexts/editor-context";
import { Button } from "@/components/ui/button";
import {
  FileTree,
  FileTreeFile,
  FileTreeFolder,
} from "@/components/ai-elements/file-tree";

interface FileBrowserProps {
  onFileSelect?: (file: string) => void;
  selectedFile?: string | null;
}

interface TreeNode {
  folders: Record<string, TreeNode>;
  files: string[];
}

function buildTree(files: string[]): TreeNode {
  const root: TreeNode = { folders: {}, files: [] };

  for (const file of files) {
    const parts = file.split("/");
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (i === parts.length - 1) {
        current.files.push(file);
      } else {
        if (!current.folders[part]) {
          current.folders[part] = { folders: {}, files: [] };
        }
        current = current.folders[part];
      }
    }
  }

  return root;
}

function RenderFile({ filePath, disabled }: { filePath: string; disabled?: boolean }) {
  const fileName = filePath.split("/").pop() || filePath;
  return (
    <FileTreeFile
      key={filePath}
      path={disabled ? "" : filePath}
      name={fileName}
      className={disabled ? "opacity-40 pointer-events-none" : undefined}
    />
  );
}

function RenderFolder({ name, path, node, disabledFiles }: { name: string; path: string; node: TreeNode; disabledFiles: Set<string> }) {
  return (
    <FileTreeFolder path={path} name={name}>
      {Object.entries(node.folders).map(([childName, childNode]) => (
        <RenderFolder
          key={`${path}/${childName}`}
          name={childName}
          path={`${path}/${childName}`}
          node={childNode}
          disabledFiles={disabledFiles}
        />
      ))}
      {node.files.map((filePath) => (
        <RenderFile
          key={filePath}
          filePath={filePath}
          disabled={disabledFiles.has(filePath.split("/").pop() || filePath)}
        />
      ))}
    </FileTreeFolder>
  );
}

export default function FileBrowser({ onFileSelect, selectedFile }: FileBrowserProps) {
  const { files } = useEditor();
  const disabledFiles = new Set(["main.pdf"]);
  const tree = useMemo(() => buildTree(files), [files]);

  return (
    <div className="h-full flex flex-col border-r bg-background">
      {/* Header */}
      <div className="p-3 border-b">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Folder className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold text-sm">Files</span>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon-xs" className="h-6 w-6">
              <FolderPlus className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon-xs" className="h-6 w-6">
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>
        <div className="text-xs font-medium text-muted-foreground uppercase">
          Project Folder
        </div>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto">
        <FileTree
          selectedPath={selectedFile ?? undefined}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onSelect={onFileSelect as any}
          className="border-0 rounded-none"
        >
          {tree.files.map((filePath) => (
            <RenderFile
              key={filePath}
              filePath={filePath}
              disabled={disabledFiles.has(filePath.split("/").pop() || filePath)}
            />
          ))}
          {Object.entries(tree.folders).map(([name, node]) => (
            <RenderFolder key={name} name={name} path={name} node={node} disabledFiles={disabledFiles} />
          ))}
        </FileTree>
      </div>

      {/* Footer */}
      <div className="p-3 border-t text-xs text-muted-foreground">
        All changes are saved locally to your project directory.
      </div>
    </div>
  );
}
