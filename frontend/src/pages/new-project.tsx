import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { open } from "@tauri-apps/plugin-dialog";
import { FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import TopNavigation from "@/components/top-navigation";
import { getTemplates, initProject, type TemplateInfo } from "@/api/client";
import { saveRecentProject } from "@/lib/recent-projects";

export default function NewProject() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<TemplateInfo[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [projectName, setProjectName] = useState("my-document");
  const [parentDir, setParentDir] = useState("");

  useEffect(() => {
    getTemplates().then((res) => {
      if (res.success && res.data) {
        setTemplates(res.data.templates);
        if (res.data.templates.length > 0) {
          setSelectedTemplate(res.data.templates[0].id);
        }
        setParentDir(res.data.default_documents_dir);
      }
    }).catch(console.error);
  }, []);

  const selectedTemplateName = templates.find((t) => t.id === selectedTemplate)?.name ?? "";

  const handleBrowse = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: "Select parent directory",
      });
      if (selected) {
        setParentDir(selected as string);
      }
    } catch (error) {
      console.error("Failed to select directory:", error);
    }
  };

  const handleCreate = async () => {
    const dir = `${parentDir}/${projectName}`;
    await initProject(dir, selectedTemplate);
    saveRecentProject(dir, projectName);
    navigate(`/editor?dir=${encodeURIComponent(dir)}`);
  };

  return (
    <div className="flex flex-col h-screen">
      <TopNavigation />

      <div className="flex flex-1 overflow-hidden p-6 gap-8">
        {/* Template grid */}
        <div className="flex-1 flex items-center justify-center">
          <div className="grid grid-cols-3 gap-3" style={{ gridTemplateRows: "repeat(2, 12rem)" }}>
            {templates.map((template) => (
              <Card
                key={template.id}
                className={`cursor-pointer transition-colors hover:bg-accent ${selectedTemplate === template.id ? "ring-2 ring-primary" : ""
                  }`}
                onClick={() => setSelectedTemplate(template.id as string)}
              >
                <CardContent className="flex flex-col items-center justify-center gap-2 py-6">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                  <p className="font-semibold text-sm text-center">{template.name}</p>
                  <p className="text-xs text-muted-foreground text-center">{template.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Config panel */}
        <div className="w-72 flex flex-col justify-between">
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold">New project</h2>
              <p className="text-sm text-muted-foreground">Using template: {selectedTemplateName}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-name">Project name</Label>
              <Input
                id="project-name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="parent-dir">
                Parent directory{" "}
                <span className="text-muted-foreground font-normal">
                  (will create a new folder in this location)
                </span>
              </Label>
              <div className="flex gap-2">
                <Input
                  id="parent-dir"
                  value={parentDir}
                  placeholder="~/Documents"
                  onChange={(e) => setParentDir(e.target.value)}
                  className="flex-1"
                />
                <Button variant="outline" onClick={handleBrowse}>
                  Browse
                </Button>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleCreate} className="gap-1">
              <Plus className="h-4 w-4" />
              Create
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
