import { useState, useEffect } from "react";
import { File, Folder, Plus, FolderPlus } from "lucide-react";
import { useEditor } from "@/contexts/editor-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FileBrowserProps {
  onFileSelect?: (file: string) => void;
  selectedFile?: string | null;
}

export default function FileBrowser({ onFileSelect, selectedFile }: FileBrowserProps) {
  const { files, dir } = useEditor();
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  // Organize files into a tree structure
  const fileTree = files.reduce((acc, file) => {
    const parts = file.split("/");
    let current = acc;
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;
      
      if (isLast) {
        current.files = current.files || [];
        current.files.push(file);
      } else {
        current.folders = current.folders || {};
        if (!current.folders[part]) {
          current.folders[part] = { folders: {}, files: [] };
        }
        current = current.folders[part];
      }
    }
    
    return acc;
  }, { folders: {} as Record<string, any>, files: [] as string[] });

  const toggleFolder = (folderPath: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderPath)) {
        next.delete(folderPath);
      } else {
        next.add(folderPath);
      }
      return next;
    });
  };

  const renderFile = (filePath: string, level: number = 0) => {
    const fileName = filePath.split("/").pop() || filePath;
    const isSelected = selectedFile === filePath;
    
    return (
      <button
        key={filePath}
        onClick={() => onFileSelect?.(filePath)}
        className={cn(
          "w-full flex items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-accent rounded-md transition-colors",
          isSelected && "bg-accent font-medium",
          level > 0 && `pl-${level * 4 + 3}`
        )}
        style={{ paddingLeft: `${level * 16 + 12}px` }}
      >
        <File className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="truncate">{fileName}</span>
      </button>
    );
  };

  const renderFolder = (folderName: string, folderData: any, path: string, level: number = 0) => {
    const isExpanded = expandedFolders.has(path);
    const hasContent = Object.keys(folderData.folders || {}).length > 0 || (folderData.files || []).length > 0;

    return (
      <div key={path}>
        <button
          onClick={() => {
            if (hasContent) {
              toggleFolder(path);
            }
          }}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-accent rounded-md transition-colors",
            !hasContent && "opacity-50 cursor-default"
          )}
          style={{ paddingLeft: `${level * 16 + 12}px` }}
        >
          <Folder className={cn(
            "h-4 w-4 text-muted-foreground shrink-0 transition-all",
            isExpanded && "text-primary"
          )} />
          <span className="truncate">{folderName}</span>
        </button>
        {isExpanded && hasContent && (
          <div>
            {Object.entries(folderData.folders || {}).map(([name, data]: [string, any]) =>
              renderFolder(name, data, `${path}/${name}`, level + 1)
            )}
            {(folderData.files || []).map((file: string) => renderFile(file, level + 1))}
          </div>
        )}
      </div>
    );
  };

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
      <div className="flex-1 overflow-y-auto p-2">
        {/* Root level files */}
        {(fileTree.files || []).map((file: string) => renderFile(file, 0))}
        
        {/* Folders */}
        {Object.entries(fileTree.folders || {}).map(([name, data]: [string, any]) =>
          renderFolder(name, data, name, 0)
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t text-xs text-muted-foreground">
        All changes are saved locally to your project directory.
      </div>
    </div>
  );
}
