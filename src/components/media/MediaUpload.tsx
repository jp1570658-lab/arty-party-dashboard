"use client";

import { useRef, useState } from "react";
import { UploadCloud, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function MediaUpload({
  onFiles,
  uploading,
}: {
  onFiles: (files: FileList) => void;
  uploading: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  return (
    <div
      onClick={() => ref.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        if (e.dataTransfer.files.length) onFiles(e.dataTransfer.files);
      }}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors",
        dragging ? "border-brand-purple bg-brand-purple-light" : "border-line hover:border-line-strong"
      )}
    >
      {uploading ? (
        <Loader2 className="h-7 w-7 animate-spin text-brand-purple" />
      ) : (
        <UploadCloud className="h-7 w-7 text-ink-muted" />
      )}
      <div className="text-sm text-ink-secondary">
        <span className="font-medium text-brand-purple">Click to upload</span> or drag photos & videos here
      </div>
      <div className="text-xs text-ink-muted">Images and video, up to 50MB each</div>
      <input
        ref={ref}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={(e) => e.target.files?.length && onFiles(e.target.files)}
      />
    </div>
  );
}
