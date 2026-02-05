import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { open } from "@tauri-apps/plugin-dialog";
import { FolderOpen, Clock, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

// Dummy recent directories for now
const RECENT_DIRS = [
  { path: "/Users/vivek/Documents/thesis", name: "thesis" },
  { path: "/Users/vivek/Documents/research-paper", name: "research-paper" },
  { path: "/Users/vivek/Documents/grant-proposal", name: "grant-proposal" },
];

export default function SelectDir() {
  const navigate = useNavigate();
  const [selectedPath, setSelectedPath] = useState<string>("");

  async function handleBrowse() {
    const selected = await open({
      directory: true,
      multiple: false,
      title: "Select Project Directory",
    });

    if (selected) {
      setSelectedPath(selected as string);
    }
  }

  function handleOpen() {
    if (selectedPath) {
      // Navigate to editor with the selected directory
      navigate(`/editor?dir=${encodeURIComponent(selectedPath)}`);
    }
  }

  function handleRecentClick(path: string) {
    setSelectedPath(path);
  }

  return (
    <div className="flex items-center justify-center h-screen w-fit m-auto">
      <Card className="w-[500px]">
        <CardHeader>
          <CardTitle>Select Project Directory</CardTitle>
          <CardDescription>
            Choose a directory for your LaTeX project
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Directory Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Project Directory</label>
            <div className="flex gap-2">
              <Input
                value={selectedPath}
                placeholder="No directory selected"
                readOnly
                className="flex-1"
              />
              <Button variant="outline" onClick={handleBrowse}>
                <FolderOpen className="h-4 w-4 mr-2" />
                Browse
              </Button>
            </div>
          </div>

          <Separator />

          {/* Recent Directories */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Clock className="h-4 w-4" />
              Recent Directories
            </div>
            <div className="space-y-1">
              {RECENT_DIRS.map((dir) => (
                <button
                  key={dir.path}
                  onClick={() => handleRecentClick(dir.path)}
                  className="w-full flex items-center justify-between p-3 rounded-md hover:bg-accent text-left transition-colors group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{dir.name}</div>
                    <div className="text-sm text-muted-foreground truncate">
                      {dir.path}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={handleOpen} disabled={!selectedPath}>
            Open Project
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
