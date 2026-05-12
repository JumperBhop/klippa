const BASE = "https://api.getklippa.de";

export interface StyleSettings {
  subtitle_style?: string;
  text_color?: string;
  watermark?: boolean;
}

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
  user_id?: string;
  style?: StyleSettings;
}): Promise<{ job_id: string }> {
  const res = await fetch(`${BASE}/api/process`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getUserInfo(user_id: string): Promise<{ plan: string; credits: number }> {
  const res = await fetch(`${BASE}/api/user/${user_id}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getUserJobs(user_id: string): Promise<any[]> {
  const res = await fetch(`${BASE}/api/user/${user_id}/jobs`);
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

export async function uploadAudio(job_id: string, file: File): Promise<void> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`${BASE}/api/upload-audio/${job_id}`, { method: "POST", body: fd });
  if (!res.ok) throw new Error(await res.text());
}

export interface VideoInfo {
  title: string;
  thumbnail: string | null;
  duration: number | null;
  uploader: string | null;
  platform: string;
}

export async function dlInfo(url: string): Promise<VideoInfo> {
  const res = await fetch(`${BASE}/api/dl/info`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) {
    const txt = await res.text();
    let msg = txt;
    try { msg = JSON.parse(txt).detail ?? txt; } catch {}
    throw new Error(msg);
  }
  return res.json();
}

export async function dlGetUrl(url: string): Promise<{ url: string; title?: string; thumbnail?: string; filename?: string }> {
  const res = await fetch(`${BASE}/api/dl/url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) {
    const txt = await res.text();
    let msg = txt;
    try { msg = JSON.parse(txt).detail ?? txt; } catch {}
    throw new Error(msg);
  }
  return res.json();
}

export function downloadUrl(clip_id: string): string {
  return `${BASE}/api/download/${clip_id}`;
}

export function zipUrl(job_id: string): string {
  return `${BASE}/api/download/${job_id}/zip`;
}

// ── Import API ────────────────────────────────────────────────────────────────

export interface ImportStatus {
  job_id: string;
  status: "processing" | "done" | "error";
  progress: number;
  step: string;
  error?: string;
  platform: string;
  result?: {
    title: string;
    duration: number;
    thumbnail: string | null;
    platform: string;
    file_path: string;
  };
}

export async function startImport(url: string, user_id?: string): Promise<{ job_id: string; platform: string }> {
  const res = await fetch(`${BASE}/api/import`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, user_id }),
  });
  if (!res.ok) {
    const txt = await res.text();
    let msg = txt;
    try { msg = JSON.parse(txt).detail ?? txt; } catch {}
    throw new Error(msg);
  }
  return res.json();
}

export async function getImportStatus(job_id: string): Promise<ImportStatus> {
  const res = await fetch(`${BASE}/api/import/${job_id}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
