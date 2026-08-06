import { useState } from "react";
import { Download, RotateCw, ZoomIn, ZoomOut, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function DocumentViewer({
  label,
  fileUrl,
  className,
}: {
  label: string;
  fileUrl?: string;
  className?: string;
}) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-background", className)}>
      <div className="flex items-center justify-between gap-2 border-b border-border bg-card px-3 py-2">
        <span className="truncate text-xs font-medium text-muted-foreground">{label}</span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Zoom out"
            onClick={() => setZoom((z) => Math.max(0.5, Number((z - 0.25).toFixed(2))))}
          >
            <ZoomOut className="size-4" />
          </Button>
          <span className="num w-10 text-center text-xs text-muted-foreground">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Zoom in"
            onClick={() => setZoom((z) => Math.min(3, Number((z + 0.25).toFixed(2))))}
          >
            <ZoomIn className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Rotate"
            onClick={() => setRotation((r) => (r + 90) % 360)}
          >
            <RotateCw className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Download document">
            <Download className="size-4" />
          </Button>
        </div>
      </div>
      <div className="canvas-grid scroll-slim grid flex-1 place-items-center overflow-auto p-6">
        <div
          className="grid aspect-[1.58/1] w-[min(100%,26rem)] place-items-center rounded-lg border border-border bg-elevated/70 text-muted-foreground transition-transform duration-200"
          style={{ transform: `scale(${zoom}) rotate(${rotation}deg)` }}
        >
          {fileUrl ? (
            <img src={fileUrl} alt={label} className="h-full w-full rounded-lg object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-center">
              <FileText className="size-8 text-primary" />
              <p className="text-xs">{label}</p>
              <p className="text-[10px] text-subtle">Secure preview · watermark applied</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
