"use client";

import { useState, useRef, useCallback } from "react";
import Navbar from "@/components/Navbar";
import { dlInfo, dlGetUrl, startImport, getImportStatus, type VideoInfo, type ImportStatus } from "@/lib/api";

// ── Plattform-Erkennung ────────────────────────────────────────────────────
function detectPlatform(url: string) {
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
  if (url.includes("tiktok.com") || url.includes("vm.tiktok.com")) return "tiktok";
  if (url.includes("instagram.com")) return "instagram";
  if (url.includes("twitter.com") || url.includes("x.com")) return "twitter";
  if (url.startsWith("http")) return "other";
  return null;
}

const PLATFORM_COLORS: Record<string, string> = {
  youtube: "#ff0000", tiktok: "#ee1d52", instagram: "#e1306c",
  twitter: "#1da1f2", other: "#a855f7",
};
const PLATFORM_LABELS: Record<string, string> = {
  youtube: "YouTube", tiktok: "TikTok", instagram: "Instagram",
  twitter: "X / Twitter", other: "Video",
};

function PlatformIcon({ platform, size = 18 }: { platform: string; size?: number }) {
  if (platform === "youtube") return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#ff0000">
      <path d="M23.5 6.2a3 3 0 00-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 00.5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 002.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 002.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.8 15.5V8.5l6.2 3.5-6.2 3.5z" />
    </svg>
  );
  if (platform === "tiktok") return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#ee1d52">
      <path d="M19.6 3a3.6 3.6 0 01-3.6-3.6h-3.2V15.6a2.4 2.4 0 11-2.4-2.4c.2 0 .5 0 .7.1V10a5.6 5.6 0 105.6 5.6V8.2a8.4 8.4 0 004.9 1.6V6.6A3.6 3.6 0 0119.6 3z" />
    </svg>
  );
  if (platform === "instagram") return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#e1306c" strokeWidth="2">
      <rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="#e1306c" />
    </svg>
  );
  if (platform === "twitter") return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#1da1f2">
      <path d="M18.9 1h3.5l-7.6 8.7L23.5 23h-7L11 15.1 4.5 23H1l8.1-9.3L1 1h7.2l5 6.6L18.9 1zm-1.2 19.8h1.9L6.4 3h-2L17.7 20.8z" />
    </svg>
  );
  return <svg width={size} height={size} viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="8" stroke="#a855f7" strokeWidth="1.5" /></svg>;
}

function fmtDuration(s: number) {
  const m = Math.floor(s / 60), sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

// ── Fortschritts-Spinner ───────────────────────────────────────────────────
function Spinner({ size = 28 }: { size?: number }) {
  return (
    <svg className="animate-spin" width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="#a855f7" strokeWidth="2" strokeDasharray="40" strokeDashoffset="15" />
    </svg>
  );
}

// ── State-Typen ────────────────────────────────────────────────────────────
type PageState = "idle" | "loading_info" | "ready" | "importing" | "done" | "error";

interface ImportedVideo {
  title: string;
  duration: number;
  thumbnail: string | null;
  platform: string;
  cdnUrl?: string;
}

export default function DownloadPage() {
  const [url, setUrl] = useState("");
  const [state, setState] = useState<PageState>("idle");
  const [info, setInfo] = useState<VideoInfo | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [importStep, setImportStep] = useState("");
  const [imported, setImported] = useState<ImportedVideo | null>(null);
  const [error, setError] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const platform = detectPlatform(url);
  const isYouTube = platform === "youtube";

  const stopPoll = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  };

  const reset = () => {
    stopPoll();
    setUrl(""); setInfo(null); setError("");
    setImportProgress(0); setImportStep(""); setImported(null);
    setState("idle");
  };

  // ── Schritt 1: Video-Info laden ─────────────────────────────────────────
  const handleLoad = async () => {
    if (!url || !platform) return;
    setState("loading_info");
    setError("");
    setInfo(null);
    try {
      const data = await dlInfo(url);
      setInfo(data);
      setState("ready");
    } catch {
      setState("ready"); // auch ohne Info weitermachen
    }
  };

  // ── Schritt 2a: YouTube-Download (CDN-URL via RapidAPI → Browser lädt direkt) ──
  const handleImportYouTube = useCallback(async () => {
    if (!url) return;
    setState("importing");
    setError("");
    setImportProgress(20);
    setImportStep("Download-Link wird abgerufen…");

    try {
      const { url: cdnUrl, title: cdnTitle, thumbnail: cdnThumb } = await dlGetUrl(url);
      const filename = cdnTitle ? `${cdnTitle.slice(0, 80).replace(/[/\\?%*:|"<>]/g, "_")}.mp4` : "youtube-video.mp4";

      setImportProgress(40);
      setImportStep("Video wird heruntergeladen…");

      // Try fetch → blob → same-origin download (forces file download, not video tab)
      let downloadStarted = false;
      try {
        const resp = await fetch(cdnUrl);
        if (!resp.ok) throw new Error(`CDN: ${resp.status}`);
        const contentLength = resp.headers.get("content-length");
        const total = contentLength ? parseInt(contentLength) : 0;
        const reader = resp.body!.getReader();
        const chunks: Uint8Array<ArrayBuffer>[] = [];
        let received = 0;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          received += value.length;
          if (total > 0) {
            setImportProgress(40 + Math.round((received / total) * 55));
          } else {
            setImportProgress(p => Math.min(p + 2, 94));
          }
        }
        const blob = new Blob(chunks, { type: "video/mp4" });
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
        downloadStarted = true;
      } catch {
        // CORS or network error — fall back to direct navigation in new tab
      }

      if (!downloadStarted) {
        // Fallback: open in new tab (user can right-click → Save)
        const a = document.createElement("a");
        a.href = cdnUrl;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        document.body.appendChild(a);
        a.click();
        a.remove();
      }

      setImportProgress(100);
      setImported({
        title:     cdnTitle ?? info?.title ?? "YouTube-Video",
        duration:  info?.duration ?? 0,
        thumbnail: cdnThumb ?? info?.thumbnail ?? null,
        platform:  "youtube",
        cdnUrl,
      });
      setState("done");
    } catch (e: any) {
      setError(e.message ?? "Download fehlgeschlagen");
      setState("error");
    }
  }, [url, info]);

  // ── Schritt 2b: Direkt-Download für TikTok/Instagram (via Cobalt/yt-dlp) ─
  const handleDirectDownload = async () => {
    if (!url) return;
    setState("importing");
    setError("");
    try {
      const { url: cdnUrl } = await dlGetUrl(url);
      const a = document.createElement("a");
      a.href = cdnUrl;
      a.download = info?.title ? `${info.title.slice(0, 60)}.mp4` : "video.mp4";
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setState("done");
      setImported({
        title: info?.title ?? "Video",
        duration: info?.duration ?? 0,
        thumbnail: info?.thumbnail ?? null,
        platform: platform ?? "other",
      });
    } catch (e: any) {
      setError(e.message ?? "Download fehlgeschlagen");
      setState("error");
    }
  };

  const displayInfo = imported ?? (info ? {
    title: info.title ?? "",
    duration: info.duration ?? 0,
    thumbnail: info.thumbnail ?? null,
    platform: platform ?? "other",
  } : null);

  return (
    <>
      <Navbar variant="landing" />
      <main className="min-h-screen pt-24 pb-20 px-4">

        {/* Hero */}
        <div className="max-w-3xl mx-auto text-center pt-12 pb-16">
          <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full mb-6 border border-violet/20">
            <div className="w-2 h-2 rounded-full bg-violet-light animate-pulse" />
            <span className="text-sm text-chalk-dim">100% kostenlos · keine Registrierung</span>
          </div>

          <h1 className="font-bold text-chalk text-4xl md:text-6xl leading-tight mb-5"
            style={{ fontFamily: "'Clash Display', sans-serif" }}>
            Video Downloader
            <span className="block text-transparent bg-clip-text"
              style={{ backgroundImage: "linear-gradient(135deg,#a855f7,#7c3aed)" }}>
              ohne Werbung
            </span>
          </h1>
          <p className="text-chalk-dim text-lg md:text-xl max-w-xl mx-auto mb-10">
            YouTube, TikTok, Instagram & Twitter — direkt herunterladen.
            Kein Redirect, keine Pop-ups, kein Abo.
          </p>

          {/* Platform badges */}
          <div className="flex items-center gap-3 flex-wrap justify-center mb-12">
            {(["youtube","tiktok","instagram","twitter"] as const).map(p => (
              <div key={p} className="flex items-center gap-2 glass px-4 py-2 rounded-full">
                <PlatformIcon platform={p} size={16} />
                <span className="text-sm text-chalk-dim">{PLATFORM_LABELS[p]}</span>
              </div>
            ))}
          </div>

          {/* ── Hauptkarte ────────────────────────────────────────────── */}
          <div className="glass rounded-2xl p-6 md:p-8 text-left">

            {/* Fehler-Banner */}
            {error && (
              <div className="mb-5 glass rounded-xl px-4 py-4 border border-red-500/30">
                <p className="text-red-400 text-sm font-medium mb-1">Fehler</p>
                <p className="text-chalk-dim text-xs leading-relaxed">{error}</p>
              </div>
            )}

            {/* ── IDLE / READY: URL-Eingabe ──────────────────────────────── */}
            {(state === "idle" || state === "loading_info" || state === "ready" || state === "error") && (
              <div className="flex flex-col gap-4">
                <div className="relative flex items-center">
                  {platform && (
                    <div className="absolute left-4 z-10">
                      <PlatformIcon platform={platform} size={20} />
                    </div>
                  )}
                  <input
                    type="url"
                    value={url}
                    onChange={e => { setUrl(e.target.value); if (state === "error") setState("idle"); }}
                    onKeyDown={e => e.key === "Enter" && state !== "loading_info" && handleLoad()}
                    placeholder="YouTube, TikTok oder Instagram Link einfügen…"
                    className={`w-full glass rounded-xl py-4 text-chalk placeholder:text-chalk-dim border border-white/5 focus:border-violet/40 outline-none transition-colors text-base ${platform ? "pl-12 pr-5" : "px-5"}`}
                  />
                </div>

                {platform && (
                  <div className="flex items-center gap-2 px-1">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: PLATFORM_COLORS[platform] }} />
                    <span className="text-xs text-chalk-dim">
                      {PLATFORM_LABELS[platform]} erkannt
                      {isYouTube && " — wird über RapidAPI importiert"}
                    </span>
                  </div>
                )}

                {/* Video-Info (nach "Video laden") */}
                {state === "ready" && displayInfo?.title && (
                  <div className="flex gap-4 items-start glass rounded-xl p-4">
                    {displayInfo.thumbnail ? (
                      <img src={displayInfo.thumbnail} alt="" className="w-28 h-16 object-cover rounded-lg flex-shrink-0" />
                    ) : (
                      <div className="w-28 h-16 glass-violet rounded-lg flex-shrink-0 flex items-center justify-center">
                        <PlatformIcon platform={platform ?? "other"} size={24} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-chalk font-medium text-sm leading-tight line-clamp-2 mb-1">{displayInfo.title}</p>
                      {displayInfo.duration > 0 && (
                        <span className="text-xs text-chalk-dim">{fmtDuration(displayInfo.duration)}</span>
                      )}
                    </div>
                  </div>
                )}

                {state === "idle" || state === "error" ? (
                  <button
                    onClick={handleLoad}
                    disabled={!platform}
                    className="btn-primary w-full py-4 rounded-xl text-base disabled:opacity-40"
                  >
                    <span>Video laden</span>
                  </button>
                ) : state === "loading_info" ? (
                  <div className="flex items-center justify-center gap-3 py-4">
                    <Spinner size={22} />
                    <span className="text-chalk-dim text-sm">Video wird geladen…</span>
                  </div>
                ) : (
                  /* state === "ready" */
                  <div className="flex gap-3">
                    {isYouTube ? (
                      <button
                        onClick={handleImportYouTube}
                        className="btn-primary flex-1 py-4 rounded-xl text-base flex items-center justify-center gap-2"
                      >
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                          <path d="M9 2v10M6 10l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M2 14h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                        <span>YouTube-Video herunterladen</span>
                      </button>
                    ) : (
                      <button
                        onClick={handleDirectDownload}
                        className="btn-primary flex-1 py-4 rounded-xl text-base flex items-center justify-center gap-2"
                      >
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                          <path d="M9 2v10M6 10l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M2 14h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                        <span>Herunterladen</span>
                      </button>
                    )}
                    <button onClick={reset} className="btn-ghost px-5 py-4 rounded-xl text-sm">
                      Zurück
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── IMPORTING: Fortschritts-Anzeige ───────────────────────── */}
            {state === "importing" && (
              <div className="flex flex-col items-center gap-5 py-6">
                <Spinner size={40} />
                <div className="text-center">
                  <p className="text-chalk font-medium text-sm mb-1">
                    {importStep || "Video wird heruntergeladen…"}
                  </p>
                </div>
                <div className="w-full max-w-xs">
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${importProgress}%`, background: "linear-gradient(90deg,#7c3aed,#a855f7)" }}
                    />
                  </div>
                  <p className="text-[10px] text-chalk-dim mt-1 text-right font-mono">{importProgress}%</p>
                </div>
              </div>
            )}

            {/* ── DONE ──────────────────────────────────────────────────── */}
            {state === "done" && (
              <div className="flex flex-col gap-5">
                {displayInfo && (
                  <div className="flex gap-4 items-start glass rounded-xl p-4">
                    {displayInfo.thumbnail ? (
                      <img src={displayInfo.thumbnail} alt="" className="w-28 h-16 object-cover rounded-lg flex-shrink-0" />
                    ) : (
                      <div className="w-28 h-16 glass-violet rounded-lg flex-shrink-0 flex items-center justify-center">
                        <PlatformIcon platform={displayInfo.platform} size={24} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-chalk font-medium text-sm leading-tight line-clamp-2 mb-1">{displayInfo.title}</p>
                      {displayInfo.duration > 0 && (
                        <span className="text-xs text-chalk-dim">{fmtDuration(displayInfo.duration)}</span>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 glass rounded-xl p-4 border border-violet/20">
                  <div className="w-10 h-10 rounded-full bg-violet/20 border border-violet/40 flex items-center justify-center flex-shrink-0">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path d="M3.5 9l3.5 3.5 7-7" stroke="#a855f7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-chalk font-medium text-sm">
                      Download gestartet!
                    </p>
                    <p className="text-chalk-dim text-xs mt-0.5">
                      Das Video erscheint in deinen Downloads.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 flex-wrap">
                  {displayInfo?.cdnUrl && (
                    <a
                      href={displayInfo.cdnUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-ghost flex-1 py-3 rounded-xl text-sm text-center flex items-center justify-center gap-2"
                    >
                      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                        <path d="M8 2v8M5 8l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span>Erneut herunterladen</span>
                    </a>
                  )}
                  <button onClick={reset} className="btn-primary flex-1 py-3 rounded-xl text-sm">
                    Weiteres Video
                  </button>
                </div>
              </div>
            )}
          </div>

          <p className="text-xs text-chalk-dim mt-4 text-center">
            YouTube via RapidAPI · TikTok & Instagram via yt-dlp · Kein Login nötig
          </p>
        </div>

        {/* Feature-Grid */}
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 mb-20">
          {[
            {
              icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M11 2L19 6v9l-8 4-8-4V6l8-4z" stroke="#a855f7" strokeWidth="1.5" strokeLinejoin="round" /></svg>,
              title: "Alle Plattformen",
              desc: "YouTube (RapidAPI), TikTok, Instagram Reels, Twitter/X.",
            },
            {
              icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="9" stroke="#a855f7" strokeWidth="1.5" /><path d="M7 11l3 3 5-5" stroke="#a855f7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>,
              title: "Komplett kostenlos",
              desc: "Keine versteckten Kosten, kein Abo, keine Registrierung erforderlich.",
            },
            {
              icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="2" y="2" width="18" height="18" rx="4" stroke="#a855f7" strokeWidth="1.5" /><path d="M7 11h8" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" /></svg>,
              title: "Keine Werbung",
              desc: "Kein Pop-up, kein Redirect, keine nervigen Banner.",
            },
          ].map(f => (
            <div key={f.title} className="glass rounded-2xl p-6">
              <div className="w-11 h-11 glass-violet rounded-xl flex items-center justify-center mb-4">{f.icon}</div>
              <h3 className="text-chalk font-semibold mb-2">{f.title}</h3>
              <p className="text-chalk-dim text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA zu Clip-Editor */}
        <div className="max-w-3xl mx-auto">
          <div className="glass-violet rounded-2xl p-8 text-center border border-violet/20">
            <h2 className="text-chalk font-bold text-2xl mb-3" style={{ fontFamily: "'Clash Display', sans-serif" }}>
              Willst du mehr aus deinen Videos rausholen?
            </h2>
            <p className="text-chalk-dim mb-6 max-w-lg mx-auto">
              Klippa schneidet automatisch die besten Momente aus deinen Videos — perfekt für TikTok, Reels & Shorts.
            </p>
            <a href="/app" className="btn-primary px-8 py-3.5 rounded-xl text-sm inline-flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 1l5 3v6l-5 3L3 10V4l5-3z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
              </svg>
              <span>Clips automatisch erstellen</span>
            </a>
          </div>
        </div>
      </main>
    </>
  );
}
