import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { open } from "@tauri-apps/plugin-dialog";
import {
  FileText,
  Plus,
  BookOpen,
  Presentation,
  GraduationCap,
  ScrollText,
  FileCode2,
  AlignLeft,
  FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import TopNavigation from "@/components/top-navigation";
import { getTemplates, initProject, type TemplateInfo } from "@/api/client";
import { saveRecentProject } from "@/lib/recent-projects";

/** Map template IDs (or name substrings) to a nice icon */
function TemplateIcon({
  id,
  name,
  className,
}: {
  id: string;
  name: string;
  className?: string;
}) {
  const key = `${id} ${name}`.toLowerCase();
  if (key.includes("beamer") || key.includes("slide") || key.includes("presentation"))
    return <Presentation className={className} />;
  if (key.includes("thesis") || key.includes("dissert"))
    return <GraduationCap className={className} />;
  if (key.includes("book")) return <BookOpen className={className} />;
  if (key.includes("letter") || key.includes("memo"))
    return <ScrollText className={className} />;
  if (key.includes("code") || key.includes("algorithm"))
    return <FileCode2 className={className} />;
  if (key.includes("article") || key.includes("paper"))
    return <AlignLeft className={className} />;
  return <FileText className={className} />;
}

export default function NewProject() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<TemplateInfo[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [projectName, setProjectName] = useState("my-document");
  const [parentDir, setParentDir] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    getTemplates()
      .then((res) => {
        if (res.success && res.data) {
          setTemplates(res.data.templates);
          if (res.data.templates.length > 0) {
            setSelectedTemplate(res.data.templates[0].id);
          }
          setParentDir(res.data.default_documents_dir);
        }
      })
      .catch(console.error);
  }, []);

  const selectedTemplateName =
    templates.find((t) => t.id === selectedTemplate)?.name ?? "";

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
    if (!projectName.trim() || !parentDir.trim()) return;
    const dir = `${parentDir}/${projectName}`;
    setIsCreating(true);
    try {
      await initProject(dir, selectedTemplate);
      saveRecentProject(dir, projectName);
      navigate(`/editor?dir=${encodeURIComponent(dir)}`);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <TopNavigation />

      <div className="flex flex-1 overflow-hidden">
        {/* ── Template picker ─────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-y-auto p-8">
          <div className="max-w-2xl w-full mx-auto space-y-6">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">New project</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Choose a starting template for your document
              </p>
            </div>

            {templates.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-16 text-muted-foreground">
                <FileText className="h-8 w-8 opacity-40" />
                <p className="text-sm">Loading templates…</p>
              </div>
            ) : (
              <div
                className="grid gap-3"
                style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}
                role="listbox"
                aria-label="Document templates"
              >
                {templates.map((template) => {
                  const isSelected = selectedTemplate === template.id;
                  return (
                    <Card
                      key={template.id}
                      role="option"
                      aria-selected={isSelected}
                      tabIndex={0}
                      className={`cursor-pointer transition-all select-none outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                        isSelected
                          ? "ring-2 ring-primary bg-accent/60"
                          : "hover:bg-accent/40"
                      }`}
                      onClick={() => setSelectedTemplate(template.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedTemplate(template.id);
                        }
                      }}
                    >
                      <CardContent className="flex flex-col items-center justify-center gap-2.5 py-6 px-3">
                        <div
                          className={`rounded-lg p-2 ${
                            isSelected
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          <TemplateIcon
                            id={template.id}
                            name={template.name}
                            className="h-5 w-5"
                          />
                        </div>
                        <div className="space-y-1 text-center">
                          <p className="font-medium text-sm leading-snug">
                            {template.name}
                          </p>
                          {template.description && (
                            <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">
                              {template.description}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Config sidebar ──────────────────────────────── */}
        <div className="w-72 shrink-0 border-l flex flex-col">
          <div className="px-6 py-5 border-b">
            <h2 className="text-sm font-semibold">Project details</h2>
            {selectedTemplateName && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Using&nbsp;<span className="font-medium text-foreground">{selectedTemplateName}</span>
              </p>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="project-name">Project name</Label>
              <Input
                id="project-name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="my-document"
                autoComplete="off"
                spellCheck={false}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="parent-dir">
                Save location
              </Label>
              <p className="text-[11px] text-muted-foreground -mt-1">
                A new folder will be created here
              </p>
              <div className="flex gap-2">
                <Input
                  id="parent-dir"
                  value={parentDir}
                  placeholder="~/Documents"
                  onChange={(e) => setParentDir(e.target.value)}
                  className="flex-1 font-mono text-xs"
                  spellCheck={false}
                />
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Browse for directory"
                  onClick={handleBrowse}
                >
                  <FolderOpen className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-t">
            <Button
              onClick={handleCreate}
              className="w-full gap-2"
              disabled={isCreating || !projectName.trim() || !parentDir.trim()}
              aria-label={isCreating ? "Creating project" : "Create project"}
            >
              <Plus className="h-4 w-4" />
              {isCreating ? "Creating…" : "Create project"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
