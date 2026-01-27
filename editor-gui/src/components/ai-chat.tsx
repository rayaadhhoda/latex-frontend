import { useEditor } from "@/contexts/editor-context";

export default function AIChat() {
  const { dir, files, loading, error } = useEditor();

  if (loading) {
    return <div className="text-muted-foreground">Loading files...</div>;
  }

  if (error) {
    return <div className="text-destructive">Error: {error}</div>;
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="text-sm text-muted-foreground">
        Project: {dir || "No project selected"}
      </div>
      <div className="text-sm text-muted-foreground">
        Files: {files.length} found
      </div>
      <div className="flex-1">
        {/* Chat interface will go here */}
        <p className="text-muted-foreground">Chat coming soon...</p>
      </div>
    </div>
  );
}
