import { useMemo, useCallback } from "react";
import { Folder, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { revealItemInDir } from "@tauri-apps/plugin-opener";
import { deleteFile, renameFile } from "@/api/client";
import { useEditor } from "@/contexts/editor-context";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  FileTree,
  FileTreeFile,
  FileTreeFolder,
} from "@/components/ui/file-tree";

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
    // Skip files with any hidden segment (starting with '.')
    if (parts.some((p) => p.startsWith("."))) continue;
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
  const { dir, refreshFiles, notifyFileDeleted, notifyFileRenamed } = useEditor();
  const fileName = filePath.split("/").pop() || filePath;

  const handleRevealInFinder = () => {
    if (dir) {
      revealItemInDir(`${dir}/${filePath}`);
    }
  };

  const handleRename = async () => {
    if (!dir || disabled) return;
    const parent = filePath.includes("/")
      ? filePath.slice(0, filePath.lastIndexOf("/"))
      : "";
    const newName = window.prompt("New file name:", fileName);
    if (newName === null) return;
    const trimmed = newName.trim();
    if (!trimmed || trimmed === fileName) return;
    if (trimmed.includes("/") || trimmed.includes("\\")) {
      toast.error("Name cannot contain path separators.");
      return;
    }
    const newPath = parent ? `${parent}/${trimmed}` : trimmed;
    try {
      await renameFile(dir, filePath, newPath);
      notifyFileRenamed(filePath, newPath);
      await refreshFiles();
      toast.success("File renamed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to rename file");
    }
  };

  const handleDelete = async () => {
    if (!dir || disabled) return;
    if (!window.confirm(`Delete "${fileName}"? This cannot be undone.`)) {
      return;
    }
    try {
      await deleteFile(dir, filePath);
      notifyFileDeleted(filePath);
      await refreshFiles();
      toast.success("File deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete file");
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <FileTreeFile
          key={filePath}
          path={disabled ? "" : filePath}
          name={fileName}
          className={disabled ? "opacity-40 pointer-events-none" : undefined}
        />
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onSelect={handleRevealInFinder} disabled={!dir}>
          Reveal in Finder
        </ContextMenuItem>
        {!disabled && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem onSelect={handleRename} disabled={!dir}>
              Rename…
            </ContextMenuItem>
            <ContextMenuItem variant="destructive" onSelect={handleDelete} disabled={!dir}>
              Delete
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}

function RenderFolder({ name, path, node, disabledFiles }: { name: string; path: string; node: TreeNode; disabledFiles: Set<string> }) {
  const { dir } = useEditor();

  const handleRevealInFinder = () => {
    if (dir) {
      revealItemInDir(`${dir}/${path}`);
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger>
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
          {node.files.sort().map((filePath) => (
        <RenderFile
          key={filePath}
          filePath={filePath}
          disabled={disabledFiles.has(filePath.split("/").pop() || filePath)}
        />
      ))}
        </FileTreeFolder>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onSelect={handleRevealInFinder}>
          Reveal in Finder
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

export default function FileBrowser({ onFileSelect, selectedFile }: FileBrowserProps) {
  const { files, refreshFiles, currentFile, loadFile } = useEditor();
  const disabledFiles = new Set(["main.pdf"]);
  const tree = useMemo(() => buildTree(files), [files]);

  const handleFileSelect = useCallback((path: string) => {
    if (onFileSelect) {
      onFileSelect(path);
    }
  }, [onFileSelect]);

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
            <Button variant="ghost" size="icon-xs" className="h-6 w-6" onClick={async () => { 
              await refreshFiles();
              if (currentFile) {
                await loadFile(currentFile);
              }
            }}>
              <RefreshCw className="h-3 w-3" />
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
          onSelect={handleFileSelect}
          className="border-0 rounded-none"
        >
          {Object.entries(tree.folders).map(([name, node]) => (
            <RenderFolder key={name} name={name} path={name} node={node} disabledFiles={disabledFiles} />
          ))}
          {tree.files.map((filePath) => (
            <RenderFile
              key={filePath}
              filePath={filePath}
              disabled={disabledFiles.has(filePath.split("/").pop() || filePath)}
            />
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
