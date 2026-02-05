import { useState } from "react";
import { Star, Clock, Info } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useEditor } from "@/contexts/editor-context";

export default function AIRefine() {
  const { currentFile } = useEditor();
  const [instruction, setInstruction] = useState("");
  const [sourceMaterial, setSourceMaterial] = useState("");
  const [isTransforming, setIsTransforming] = useState(false);

  const handleTransform = async () => {
    if (!instruction.trim()) return;

    setIsTransforming(true);
    try {
      // TODO: Implement transform endpoint call
      console.log("Transform:", { instruction, sourceMaterial, currentFile });
      // This would call a new backend endpoint for document transformation
    } catch (error) {
      console.error("Transform failed:", error);
    } finally {
      setIsTransforming(false);
    }
  };

  return (
    <div className="h-full flex flex-col border-l bg-background">
      <Tabs defaultValue="refine" className="flex flex-col h-full">
        <div className="p-3 border-b">
          <TabsList>
            <TabsTrigger value="refine" className="gap-2">
              <Star className="h-4 w-4" />
              Refine
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <Clock className="h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="refine" className="flex-1 flex flex-col p-4 m-0 gap-4">
          <div className="space-y-4 flex-1 overflow-y-auto">
            <div className="space-y-2">
              <label className="text-sm font-medium">INSTRUCTION</label>
              <Textarea
                placeholder="e.g., Rewrite this section to be more formal..."
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                className="min-h-[100px] resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">SOURCE MATERIAL</label>
              <Textarea
                placeholder="Paste raw research notes here..."
                value={sourceMaterial}
                onChange={(e) => setSourceMaterial(e.target.value)}
                className="min-h-[150px] resize-none"
              />
            </div>

            <div className="p-3 bg-muted rounded-md flex gap-2">
              <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Assistant suggests changes using SJSU academic standards. You maintain full oversight.
              </p>
            </div>
          </div>

          <Button
            onClick={handleTransform}
            disabled={isTransforming || !instruction.trim()}
            className="w-full gap-2"
          >
            <Star className="h-4 w-4" />
            {isTransforming ? "Transforming..." : "Transform Document"}
          </Button>
        </TabsContent>

        <TabsContent value="history" className="flex-1 p-4 m-0">
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            No history yet
          </div>
        </TabsContent>
      </Tabs>

      {/* Sync Status */}
      <div className="p-3 border-t flex items-center gap-2 text-xs text-muted-foreground">
        <div className="h-2 w-2 rounded-full bg-green-500"></div>
        <span>Sync Active</span>
      </div>
    </div>
  );
}
