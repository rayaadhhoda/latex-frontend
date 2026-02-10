import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { open } from "@tauri-apps/plugin-dialog";
import { GraduationCap, Plus, Clock, Folder, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { initProject } from "@/api/client";
import { getFileContent } from "@/api/client";

interface RecentProject {
  path: string;
  name: string;
  lastAccessed: number;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  // Load recent projects from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("recentProjects");
    if (stored) {
      try {
        const projects = JSON.parse(stored) as RecentProject[];
        // Sort by last accessed, most recent first
        const sorted = projects.sort((a, b) => b.lastAccessed - a.lastAccessed);
        setRecentProjects(sorted.slice(0, 10)); // Keep only 10 most recent
      } catch (e) {
        console.error("Failed to load recent projects:", e);
      }
    }
  }, []);

  const saveRecentProject = (path: string, name: string) => {
    const projects = recentProjects.filter((p) => p.path !== path);
    const updated = [
      { path, name, lastAccessed: Date.now() },
      ...projects,
    ].slice(0, 10);
    setRecentProjects(updated);
    localStorage.setItem("recentProjects", JSON.stringify(updated));
  };

  const getProjectName = async (path: string): Promise<string> => {
    try {
      // Try to read main.tex and extract title
      const response = await getFileContent(path, "main.tex");
      if (response.success && response.data) {
        const content = response.data.content;
        const titleMatch = content.match(/\\title\{([^}]+)\}/);
        if (titleMatch && titleMatch[1].trim()) {
          return titleMatch[1].trim();
        }
      }
    } catch (e) {
      // File doesn't exist or can't be read - use folder name
    }
    // Use folder name as fallback
    const folderName = path.split("/").pop() || "Untitled Project";
    // Clean up common folder name patterns
    return folderName.replace(/[-_]/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const formatTimeAgo = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const handleNewProject = async () => {
    setIsCreating(true);
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: "Select or Create Project Directory",
      });

      if (selected) {
        const path = selected as string;
        try {
          await initProject(path, "default");
          const name = await getProjectName(path);
          saveRecentProject(path, name);
          navigate(`/editor?dir=${encodeURIComponent(path)}`);
        } catch (error) {
          console.error("Failed to create project:", error);
          alert("Failed to create project. Please try again.");
        }
      }
    } catch (error) {
      console.error("Failed to select directory:", error);
    } finally {
      setIsCreating(false);
    }
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

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <GraduationCap className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">Academic Projects</h1>
            </div>
            <p className="text-muted-foreground">Manage your theses and course reports</p>
          </div>
          <Button onClick={handleNewProject} disabled={isCreating} className="gap-2">
            <Plus className="h-4 w-4" />
            {isCreating ? "Creating..." : "New Project"}
          </Button>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-semibold text-sm uppercase tracking-wide">Recent Activity</h2>
            </div>

            {recentProjects.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <p>No recent projects</p>
                  <p className="text-sm mt-2">Create a new project or import a directory to get started</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {recentProjects.map((project) => (
                  <Card
                    key={project.path}
                    className="cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => handleProjectClick(project)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Folder className="h-5 w-5 text-muted-foreground shrink-0" />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold truncate">{project.name}</h3>
                            <p className="text-sm text-muted-foreground truncate">{project.path}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-sm text-muted-foreground whitespace-nowrap">
                            {formatTimeAgo(project.lastAccessed)}
                          </span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Plus className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-semibold text-sm uppercase tracking-wide">Quick Actions</h2>
            </div>

            <Card
              className="cursor-pointer hover:bg-accent transition-colors border-dashed"
              onClick={handleImportDirectory}
            >
              <CardContent className="p-6 text-center">
                <Folder className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-semibold mb-1">Import Directory</h3>
                <p className="text-sm text-muted-foreground">Open an existing LaTeX workspace</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
