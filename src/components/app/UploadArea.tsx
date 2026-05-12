"use client";

import { useRef, useState } from "react";
import { uploadVideo } from "@/lib/api";

interface Props {
  onUploaded: (params: { job_id: string }) => void;
}

export default function UploadArea({ onUploaded }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setLoading(true);
    setError("");
    try {
      const { job_id } = await uploadVideo(file);
      setLoading(false);
      onUploaded({ job_id });
    } catch (e: any) {
      setError(e.message ?? "Upload fehlgeschlagen");
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="glass rounded-2xl p-6">
      {error && (
        <div className="mb-4 glass rounded-xl px-4 py-3 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div
        className={`upload-zone rounded-xl p-12 flex flex-col items-center justify-center gap-5 ${
          loading ? "opacity-50 pointer-events-none" : "cursor-pointer"
        } ${isDragging ? "drag-over" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => !loading && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />

        <div className="w-16 h-16 glass-violet rounded-2xl flex items-center justify-center">
          {loading ? (
            <svg className="animate-spin" width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#a855f7" strokeWidth="2" strokeDasharray="40" strokeDashoffset="15" />
            </svg>
          ) : (
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M14 4v14M14 4l-4 4M14 4l4 4" stroke="#a855f7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M4 22h20" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          )}
        </div>

        <div className="text-center">
          <p className="text-chalk font-medium mb-1">
            {loading ? "Wird hochgeladen…" : "Video hier ablegen"}
          </p>
          <p className="text-chalk-dim text-sm">oder klicken zum Auswählen</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap justify-center">
          {["MP4", "MOV", "WebM", "MKV"].map((fmt) => (
            <span
              key={fmt}
              className="glass px-3 py-1 rounded-full text-xs text-chalk-dim"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              .{fmt.toLowerCase()}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
