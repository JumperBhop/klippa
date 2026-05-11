const BASE = "http://localhost:8000";

export interface JobStatus {
  job_id: string;
  status: "pending" | "processing" | "done" | "error";
  progress: number;
  step: string;
  error?: string;
}

export interface ClipResult {
  id: string;
  title: string;
  score: number;
  reason: string;
  duration: string;
  time_start: number;
  time_end: number;
  download_url: string;
}

export async function uploadVideo(file: File): Promise<{ job_id: string }> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`${BASE}/api/upload`, { method: "POST", body: fd });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function processJob(params: {
  job_id?: string;
  youtube_url?: string;
}): Promise<{ job_id: string }> {
  const res = await fetch(`${BASE}/api/process`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getStatus(job_id: string): Promise<JobStatus> {
  const res = await fetch(`${BASE}/api/status/${job_id}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getClips(job_id: string): Promise<ClipResult[]> {
  const res = await fetch(`${BASE}/api/clips/${job_id}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export function downloadUrl(clip_id: string): string {
  return `${BASE}/api/download/${clip_id}`;
}

export function zipUrl(job_id: string): string {
  return `${BASE}/api/download/${job_id}/zip`;
}
