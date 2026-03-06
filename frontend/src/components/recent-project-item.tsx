import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RecentProject } from "@/lib/recent-projects";

interface RecentProjectItemProps {
  project: RecentProject;
  onClick: () => void;
  onRemove: (e: React.MouseEvent) => void;
}

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

export default function RecentProjectItem({ project, onClick, onRemove }: RecentProjectItemProps) {
  return (
    <div className="flex items-center rounded-md border hover:bg-accent transition-colors">
      <button
        onClick={onClick}
        className="flex-1 min-w-0 text-left px-4 py-6 flex flex-col justify-center cursor-pointer"
      >
        <p className="text-base font-medium mb-1">{project.name}</p>
        <p className="text-sm text-muted-foreground truncate">{project.path}</p>
      </button>
      <span className="px-4 text-sm text-muted-foreground shrink-0">
        {formatRelativeTime(project.lastAccessed)}
      </span>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onRemove}
        aria-label="Remove from recents"
        className="mr-2 shrink-0"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
