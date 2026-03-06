import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { open } from "@tauri-apps/plugin-dialog";
import { FolderOpen, Plus } from "lucide-react";
import RecentProjectItem from "@/components/recent-project-item";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import TopNavigation from "@/components/top-navigation";
import { getFileContent } from "@/api/client";
import { loadRecentProjects, saveRecentProject as persistRecentProject, removeRecentProject as persistRemoveRecentProject, type RecentProject } from "@/lib/recent-projects";

export default function Dashboard() {
  const navigate = useNavigate();
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);

  useEffect(() => {
    setRecentProjects(loadRecentProjects());
  }, []);

  const saveRecentProject = (path: string, name: string) => {
    setRecentProjects(persistRecentProject(path, name));
  };

  const getProjectName = async (path: string): Promise<string> => {
    try {
      const response = await getFileContent(path, "main.tex");
      if (response.success && response.data) {
        const content = response.data.content;
        const titleMatch = content.match(/\\title\{([^}]+)\}/);
        if (titleMatch && titleMatch[1].trim()) {
          return titleMatch[1].trim();
        }
      }
    } catch {
    // fall through to folder name
    }
    const folderName = path.split("/").pop() || "Untitled Project";
    return folderName.replace(/[-_]/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const handleNewProject = () => {
    navigate("/new-project");
  };

  const handleImportDirectory = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: "Select Existing LaTeX Workspace",
      });
      if (selected) {
        const path = selected as string;
        const name = await getProjectName(path);
        saveRecentProject(path, name);
        navigate(`/editor?dir=${encodeURIComponent(path)}`);
      }
    } catch (error) {
      console.error("Failed to import directory:", error);
    }
  };

  const handleProjectClick = (project: RecentProject) => {
    saveRecentProject(project.path, project.name);
    navigate(`/editor?dir=${encodeURIComponent(project.path)}`);
  };

  const handleRemoveProject = (e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    setRecentProjects(persistRemoveRecentProject(path));
  };

  return (
    <div className="flex flex-col h-screen select-none">
      <TopNavigation />

      <ResizablePanelGroup orientation="horizontal" className="flex-1">
        {/* Project list — scrollable */}
        <ResizablePanel defaultSize="65%" minSize="60%">
          <ScrollArea className="h-full">
            <div className="flex flex-col p-6 min-h-full">
              {recentProjects.length === 0 ? (
                <Empty className="flex-1 border-none">
                  <EmptyHeader>
                    <EmptyTitle>Create your next project →</EmptyTitle>
                    <EmptyDescription>
                      To get started, use the options in the right panel.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Recent Projects</p>
                    {recentProjects.map((project) => (
                    <RecentProjectItem
                      key={project.path}
                      project={project}
                      onClick={() => handleProjectClick(project)}
                      onRemove={(e) => handleRemoveProject(e, project.path)}
                    />
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </ResizablePanel>

        <ResizableHandle className="bg-transparent" />

        {/* Action panel */}
        <ResizablePanel defaultSize="35%" minSize="35%" maxSize="40%">
          <div className="p-4 flex flex-col gap-2 h-full items-center justify-center w-full">
            <Button size="sm" onClick={handleNewProject} className="w-4/5 gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Create new document
            </Button>
            <Button size="sm" variant="outline" onClick={handleImportDirectory} className="w-4/5 gap-1.5">
              <FolderOpen className="h-3.5 w-3.5" />
              Open existing directory
            </Button>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
