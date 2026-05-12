"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import { dlInfo, dlGetUrl, type VideoInfo } from "@/lib/api";

function detectPlatform(url: string) {
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
  if (url.includes("tiktok.com") || url.includes("vm.tiktok.com")) return "tiktok";
  if (url.includes("instagram.com")) return "instagram";
  if (url.includes("twitter.com") || url.includes("x.com")) return "twitter";
  if (url.startsWith("http")) return "other";
  return null;
}

const PLATFORM_COLORS: Record<string, string> = {
  youtube: "#ff0000", tiktok: "#ee1d52", instagram: "#e1306c", twitter: "#1da1f2", other: "#a855f7",
};
const PLATFORM_LABELS: Record<string, string> = {
  youtube: "YouTube", tiktok: "TikTok", instagram: "Instagram", twitter: "X / Twitter", other: "Video",
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
  return <svg width={size} height={size} viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="8" stroke="#a855f7" strokeWidth="1.5" /><path d="M9 5v4l3 3" stroke="#a855f7" strokeWidth="1.5" strokeLinecap="round" /></svg>;
}

function fmtDuration(s: number) {
  const m = Math.floor(s / 60), sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

type State = "idle" | "loading" | "ready" | "downloading" | "done" | "error";

export default function DownloadPage() {
  const [url, setUrl] = useState("");
  const [state, setState] = useState<State>("idle");
  const [info, setInfo] = useState<VideoInfo | null>(null);
  const [cobaltReady, setCobaltReady] = useState(false);
  const [error, setError] = useState("");

  const platform = detectPlatform(url);

  const handleLoad = async () => {
    if (!url || !platform) return;
    setState("loading");
    setError("");
    setInfo(null);
    try {
      const data = await dlInfo(url);
      setInfo(data);
      setCobaltReady(!!(data as any).cobalt_ready);
      setState("ready");
    } catch {
      // Even if info fails, go to ready so user can try download
      setState("ready");
      setCobaltReady(false);
    }
  };

  const handleDownload = async () => {
    if (!url) return;
    setState("downloading");
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
    } catch (e: any) {
      const msg: string = e.message ?? "";
      if (msg.includes("COBALT_NOT_CONFIGURED")) {
        setError("SETUP_REQUIRED");
      } else if (
        (platform === "youtube" || platform === "tiktok") &&
        (msg.includes("login") || msg.includes("bot") || msg.includes("unavailable") || msg.includes("400"))
      ) {
        setError("SERVER_BLOCKED");
      } else {
        setError(msg);
      }
      setState("error");
    }
  };

  const reset = () => {
    setUrl(""); setInfo(null); setError(""); setState("idle");
  };

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
            {[
              { id: "youtube", label: "YouTube" },
              { id: "tiktok", label: "TikTok" },
              { id: "instagram", label: "Instagram" },
              { id: "twitter", label: "X / Twitter" },
            ].map(p => (
              <div key={p.id} className="flex items-center gap-2 glass px-4 py-2 rounded-full">
                <PlatformIcon platform={p.id} size={16} />
                <span className="text-sm text-chalk-dim">{p.label}</span>
              </div>
            ))}
          </div>

          {/* Main card */}
          <div className="glass rounded-2xl p-6 md:p-8 text-left">

            {/* Error banner */}
            {error && error !== "SETUP_REQUIRED" && error !== "SERVER_BLOCKED" && (
              <div className="mb-5 glass rounded-xl px-4 py-3 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}
            {error === "SETUP_REQUIRED" && (
              <div className="mb-5 glass rounded-xl px-4 py-4 border border-amber-500/30">
                <p className="text-amber-400 text-sm font-medium mb-1">Downloader wird eingerichtet</p>
                <p className="text-chalk-dim text-xs">
                  Der Download-Service wird gerade konfiguriert. In der Zwischenzeit kannst du
                  {" "}<a href="https://cobalt.tools" target="_blank" className="text-violet-light underline">cobalt.tools</a>{" "}
                  direkt nutzen — identische Funktion, kostenlos.
                </p>
              </div>
            )}
            {error === "SERVER_BLOCKED" && (
              <div className="mb-5 glass rounded-xl px-4 py-4 border border-amber-500/30">
                <div className="flex items-start gap-3">
                  <svg className="flex-shrink-0 mt-0.5" width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 1.5L14.5 13H1.5L8 1.5z" stroke="#f59e0b" strokeWidth="1.3" strokeLinejoin="round"/>
                    <path d="M8 6v4M8 11.5h.01" stroke="#f59e0b" strokeWidth="1.3" strokeLinecap="round"/>
                  </svg>
                  <div>
                    <p className="text-amber-400 text-sm font-medium mb-1">
                      {platform === "youtube" ? "YouTube" : "TikTok"} blockiert Server-Downloads
                    </p>
                    <p className="text-chalk-dim text-xs leading-relaxed">
                      {platform === "youtube"
                        ? "YouTube erlaubt keine Downloads von Server-IPs. Lade das Video direkt über cobalt.tools herunter — selbe Funktion, läuft in deinem Browser."
                        : "TikTok blockiert Downloads von unserem Server. Nutze cobalt.tools direkt im Browser."
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}

            {state === "idle" || (state === "error" && error !== "SETUP_REQUIRED" && error !== "SERVER_BLOCKED") ? (
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
                    onKeyDown={e => e.key === "Enter" && handleLoad()}
                    placeholder="Link hier einfügen…"
                    className={`w-full glass rounded-xl py-4 text-chalk placeholder:text-chalk-dim border border-white/5 focus:border-violet/40 outline-none transition-colors text-base ${platform ? "pl-12 pr-5" : "px-5"}`}
                  />
                </div>
                {platform && (
                  <div className="flex items-center gap-2 px-1">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: PLATFORM_COLORS[platform] }} />
                    <span className="text-xs text-chalk-dim">{PLATFORM_LABELS[platform]} erkannt</span>
                  </div>
                )}
                <button
                  onClick={handleLoad}
                  disabled={!platform}
                  className="btn-primary w-full py-4 rounded-xl text-base disabled:opacity-40"
                >
                  <span>Video laden</span>
                </button>
              </div>
            ) : state === "loading" ? (
              <div className="flex flex-col items-center gap-4 py-10">
                <svg className="animate-spin" width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="#a855f7" strokeWidth="2" strokeDasharray="40" strokeDashoffset="15" />
                </svg>
                <p className="text-chalk-dim text-sm">Video wird geladen…</p>
              </div>
            ) : (state === "ready" || state === "downloading" || state === "done") ? (
              <div className="flex flex-col gap-5">
                {/* Video preview (if we have info) */}
                {info?.title && (
                  <div className="flex gap-4 items-start glass rounded-xl p-4">
                    {info.thumbnail ? (
                      <img src={info.thumbnail} alt="" className="w-28 h-16 object-cover rounded-lg flex-shrink-0" />
                    ) : (
                      <div className="w-28 h-16 glass-violet rounded-lg flex-shrink-0 flex items-center justify-center">
                        <PlatformIcon platform={platform ?? "other"} size={24} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-chalk font-medium text-sm leading-tight line-clamp-2 mb-1">{info.title}</p>
                      <div className="flex items-center gap-3 text-xs text-chalk-dim">
                        {info.uploader && <span>{info.uploader}</span>}
                        {info.duration && <span>{fmtDuration(info.duration)}</span>}
                      </div>
                    </div>
                  </div>
                )}

                {state === "done" ? (
                  <div className="flex flex-col items-center gap-3 py-4">
                    <div className="w-12 h-12 rounded-full bg-violet/20 border border-violet/40 flex items-center justify-center">
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M4 10l4 4 8-8" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <p className="text-chalk font-medium text-sm">Download gestartet!</p>
                    <p className="text-chalk-dim text-xs text-center">
                      Falls der Download nicht automatisch startet, überprüfe deine Download-Einstellungen.
                    </p>
                    <button onClick={reset} className="btn-ghost px-5 py-2 rounded-xl text-sm mt-1">
                      Weiteres Video herunterladen
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <button
                      onClick={handleDownload}
                      disabled={state === "downloading"}
                      className="btn-primary flex-1 py-4 rounded-xl text-base flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {state === "downloading" ? (
                        <>
                          <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="40" strokeDashoffset="15" />
                          </svg>
                          <span>Wird vorbereitet…</span>
                        </>
                      ) : (
                        <>
                          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                            <path d="M9 2v10M6 10l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M2 14h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                          </svg>
                          <span>Herunterladen</span>
                        </>
                      )}
                    </button>
                    <button onClick={reset} className="btn-ghost px-5 py-4 rounded-xl text-sm">
                      Zurück
                    </button>
                  </div>
                )}
              </div>
            ) : (state === "error" && (error === "SETUP_REQUIRED" || error === "SERVER_BLOCKED")) ? (
              <div className="flex flex-col gap-4">
                <div className="relative flex items-center">
                  {platform && (
                    <div className="absolute left-4 z-10">
                      <PlatformIcon platform={platform} size={20} />
                    </div>
                  )}
                  <div className={`w-full glass rounded-xl py-4 text-chalk-dim border border-white/5 text-base ${platform ? "pl-12 pr-5" : "px-5"}`}>
                    {url.slice(0, 50)}{url.length > 50 ? "…" : ""}
                  </div>
                </div>
                {/* cobalt.tools with URL pre-filled */}
                <a
                  href={`https://cobalt.tools/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary w-full py-4 rounded-xl text-base text-center flex items-center justify-center gap-2"
                  onClick={() => {
                    // Copy URL to clipboard so user can paste it on cobalt.tools
                    try { navigator.clipboard.writeText(url); } catch {}
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M7 2H3a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1V9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                    <path d="M10 2h4v4M14 2L8 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span>Auf cobalt.tools herunterladen (Link wird kopiert)</span>
                </a>
                <button onClick={reset} className="btn-ghost py-2.5 rounded-xl text-sm">
                  Zurück
                </button>
              </div>
            ) : null}
          </div>

          <p className="text-xs text-chalk-dim mt-4 text-center">
            Kein Login nötig · Keine Werbung · Kein Redirect · Direkt herunterladen
          </p>
        </div>

        {/* Feature grid */}
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 mb-20">
          {[
            {
              icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M11 2L19 6v9l-8 4-8-4V6l8-4z" stroke="#a855f7" strokeWidth="1.5" strokeLinejoin="round" /><path d="M11 11l8-5M11 11v9M11 11L3 6" stroke="#a855f7" strokeWidth="1.5" strokeLinecap="round" /></svg>,
              title: "Alle Plattformen",
              desc: "YouTube, TikTok, Instagram Reels, Twitter/X — alles aus einer Hand.",
            },
            {
              icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="9" stroke="#a855f7" strokeWidth="1.5" /><path d="M7 11l3 3 5-5" stroke="#a855f7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>,
              title: "Komplett kostenlos",
              desc: "Keine versteckten Kosten, kein Abo, keine Registrierung erforderlich.",
            },
            {
              icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="2" y="2" width="18" height="18" rx="4" stroke="#a855f7" strokeWidth="1.5" /><path d="M7 11h8M11 7v8" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" /></svg>,
              title: "Keine Werbung",
              desc: "Kein Pop-up, kein Redirect, keine nervigen Bannerwerbungen.",
            },
          ].map(f => (
            <div key={f.title} className="glass rounded-2xl p-6">
              <div className="w-11 h-11 glass-violet rounded-xl flex items-center justify-center mb-4">{f.icon}</div>
              <h3 className="text-chalk font-semibold mb-2">{f.title}</h3>
              <p className="text-chalk-dim text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA to clip editor */}
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
