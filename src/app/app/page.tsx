"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Navbar from "@/components/Navbar";
import UploadArea from "@/components/app/UploadArea";
import ProgressSteps from "@/components/app/ProgressSteps";
import ClipCard, { type Clip } from "@/components/app/ClipCard";
import UpgradeModal from "@/components/app/UpgradeModal";
import StyleModal from "@/components/app/StyleModal";
import { getStatus, getClips, zipUrl, getUserInfo, type ClipResult, type JobStatus } from "@/lib/api";
import { useUser } from "@clerk/nextjs";

const COLORS = ["#7c3aed","#4f46e5","#a855f7","#6d28d9","#8b5cf6"];

function apiToClip(c: ClipResult, i: number): Clip {
  return {
    id: c.id,
    title: c.title,
    viralScore: c.score,
    reason: c.reason,
    duration: c.duration,
    thumbnail: COLORS[i % COLORS.length],
    timeCode: `${fmt(c.time_start)} — ${fmt(c.time_end)}`,
    download_url: c.download_url,
  };
}

function fmt(s: number) {
  const m = Math.floor(s / 60), sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

type AppState = "idle" | "processing" | "done" | "error";

function RealProgressSteps({ status }: { status: JobStatus | null }) {
  const progress = status?.progress ?? 0;
  const step = status?.step ?? "Startet…";

  const steps = [
    { label: "Upload", sublabel: "Video empfangen", threshold: 0 },
    { label: "Transkription", sublabel: "Whisper transkribiert…", threshold: 15 },
    { label: "Analyse", sublabel: "GPT-4o analysiert…", threshold: 40 },
    { label: "Schnitt", sublabel: "FFmpeg schneidet…", threshold: 60 },
    { label: "Fertig", sublabel: "Clips bereit", threshold: 100 },
  ];

  const activeIdx = steps.reduce((acc, s, i) => (progress >= s.threshold ? i : acc), 0);

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <span className="text-sm font-medium text-chalk">Verarbeitungsstatus</span>
        <span className="text-xs text-chalk-dim font-mono animate-pulse" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          {progress}%
        </span>
      </div>
      <div className="h-1 bg-white/5 rounded-full mb-6 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${progress}%`, background: "linear-gradient(90deg, #7c3aed, #a855f7)" }}
        />
      </div>
      <div className="flex items-start justify-between relative">
        <div className="absolute top-4 left-4 right-4 h-px bg-white/5 z-0" />
        {steps.map((s, i) => {
          const status = i < activeIdx ? "done" : i === activeIdx ? "active" : "waiting";
          return (
            <div key={s.label} className="relative z-10 flex flex-col items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 ${status === "done" ? "bg-violet" : status === "active" ? "bg-violet/20 border-2 border-violet" : "bg-void-3 border border-white/10"}`}>
                {status === "done" ? (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 6l3 3 4-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : status === "active" ? (
                  <div className="w-2 h-2 rounded-full bg-violet animate-pulse" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-white/20" />
                )}
              </div>
              <div className="text-center hidden sm:block">
                <div className={`text-xs font-medium transition-colors duration-300 ${status === "done" ? "text-violet-light" : status === "active" ? "text-chalk" : "text-chalk-dim"}`}>
                  {s.label}
                </div>
                <div className="text-[10px] text-chalk-dim mt-0.5 whitespace-nowrap">
                  {status === "active" ? step : status === "done" ? "Abgeschlossen" : "Wartet"}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AppPage() {
  const { user } = useUser();
  const [state, setState] = useState<AppState>("idle");
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [credits, setCredits] = useState<number>(3);

  useEffect(() => {
    if (!user) return;
    getUserInfo(user.id).then(info => setCredits(info.credits)).catch(() => {});
  }, [user]);
  const [pendingUpload, setPendingUpload] = useState<{ job_id?: string; youtube_url?: string } | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [clips, setClips] = useState<Clip[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  };

  const startPolling = useCallback((id: string) => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const status = await getStatus(id);
        setJobStatus(status);
        if (status.status === "done") {
          stopPolling();
          const apiClips = await getClips(id);
          setClips(apiClips.map((c, i) => apiToClip(c, i)));
          setState("done");
        } else if (status.status === "error") {
          stopPolling();
          setErrorMsg(status.error ?? "Unbekannter Fehler");
          setState("error");
        }
      } catch {
        // backend might not be running yet — ignore transient errors
      }
    }, 2000);
  }, []);

  useEffect(() => () => stopPolling(), []);

  const handleJobStarted = (id: string) => {
    setJobId(id);
    setState("processing");
    setJobStatus({ job_id: id, status: "processing", progress: 0, step: "Startet…" });
    startPolling(id);
  };

  const handleReset = () => {
    stopPolling();
    setJobId(null);
    setJobStatus(null);
    setClips([]);
    setErrorMsg("");
    setState("idle");
    setPendingUpload(null);
  };

  return (
    <>
      <Navbar variant="app" />

      <main className="min-h-screen pt-20 pb-16 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">

          {/* App header */}
          <div className="pt-8 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="font-bold text-chalk text-3xl md:text-4xl" style={{ fontFamily: "'Clash Display', sans-serif" }}>
                {state === "idle" && "Neues Video"}
                {state === "processing" && "Wird verarbeitet…"}
                {state === "done" && "Deine Clips sind fertig"}
                {state === "error" && "Fehler aufgetreten"}
              </h1>
              <p className="text-chalk-dim text-sm mt-1">
                {state === "idle" && "Video hochladen oder YouTube-Link einfügen"}
                {state === "processing" && (jobStatus?.step ?? "KI analysiert dein Video…")}
                {state === "done" && `${clips.length} Clips gefunden und geschnitten`}
                {state === "error" && errorMsg}
              </p>
            </div>

            {state === "done" && jobId && (
              <a href={zipUrl(jobId)} download className="btn-primary px-6 py-3 rounded-xl text-sm flex items-center gap-2">
                <span className="flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 1v9M5 8l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 12h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                  </svg>
                  Alle als ZIP
                </span>
              </a>
            )}
          </div>

          {/* Upload area */}
          {state === "idle" && (
            <div className="max-w-2xl">
              <UploadArea onUploaded={(params) => setPendingUpload({ job_id: params.job_id })} />
              {credits <= 3 && (
                <div className="mt-4 glass-violet rounded-xl p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    <span className="text-sm text-chalk-dim">
                      Nur noch <span className="text-amber-400 font-semibold">{credits} Credits</span> verfügbar
                    </span>
                  </div>
                  <button onClick={() => setShowUpgrade(true)} className="text-xs text-violet-light hover:text-chalk transition-colors">
                    Upgraden
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Error state */}
          {state === "error" && (
            <div className="max-w-2xl space-y-3">
              {errorMsg.includes("YouTube-Download nicht möglich") ? (
                <div className="glass rounded-xl p-6 border border-amber-500/20">
                  <div className="flex items-start gap-3 mb-4">
                    <svg className="flex-shrink-0 mt-0.5" width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path d="M9 2L16.5 15H1.5L9 2z" stroke="#f59e0b" strokeWidth="1.5" strokeLinejoin="round"/>
                      <path d="M9 7v4M9 13h.01" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    <div>
                      <p className="text-amber-400 text-sm font-medium mb-1">YouTube-Link nicht unterstützt</p>
                      <p className="text-chalk-dim text-xs leading-relaxed">
                        YouTube blockiert Downloads von unserem Server. Bitte lade das Video zuerst herunter und lade es dann direkt hoch.
                      </p>
                    </div>
                  </div>
                  <div className="glass-violet rounded-lg p-4 mb-4">
                    <p className="text-xs text-chalk-dim font-medium mb-2">So geht's:</p>
                    <ol className="text-xs text-chalk-dim space-y-1.5 list-none">
                      <li className="flex gap-2"><span className="text-violet-light font-bold">1.</span> Installiere <a href="https://github.com/yt-dlp/yt-dlp" target="_blank" className="text-violet-light hover:underline">yt-dlp</a> oder <a href="https://4k-download.com" target="_blank" className="text-violet-light hover:underline">4K Downloader</a></li>
                      <li className="flex gap-2"><span className="text-violet-light font-bold">2.</span> Lade das YouTube-Video herunter</li>
                      <li className="flex gap-2"><span className="text-violet-light font-bold">3.</span> Lade die MP4-Datei hier hoch</li>
                    </ol>
                  </div>
                  <button onClick={handleReset} className="btn-primary px-5 py-2.5 rounded-xl text-sm w-full">
                    <span>Video hochladen</span>
                  </button>
                </div>
              ) : (
                <div className="glass rounded-xl p-6 border border-red-500/20">
                  <p className="text-red-400 text-sm mb-4">{errorMsg}</p>
                  <button onClick={handleReset} className="btn-ghost px-5 py-2.5 rounded-xl text-sm">Nochmal versuchen</button>
                </div>
              )}
            </div>
          )}

          {/* Progress */}
          {state === "processing" && (
            <div className="max-w-3xl">
              <RealProgressSteps status={jobStatus} />
            </div>
          )}

          {/* Clip grid */}
          {state === "done" && (
            <div>
              <div className="flex items-center gap-3 mb-6 overflow-x-auto pb-1">
                {["Alle", "Score 90+", "Score 75+", "Kurz (<1 Min)", "Lang (>1 Min)"].map((f, i) => (
                  <button key={f} className={`px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200 flex-shrink-0 ${i === 0 ? "bg-violet text-white" : "glass text-chalk-dim border border-white/5 hover:border-violet/30"}`}>
                    {f}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {clips.map((clip) => <ClipCard key={clip.id} clip={clip} />)}
              </div>

              {/* Re-upload CTA */}
              <div className="mt-10 glass rounded-xl p-5 flex flex-col sm:flex-row items-center gap-4 justify-between">
                <div>
                  <p className="text-sm text-chalk font-medium">Weiteres Video verarbeiten?</p>
                  <p className="text-xs text-chalk-dim mt-0.5">
                    {credits} Credit{credits !== 1 ? "s" : ""} verbleibend
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setState("idle")}
                    className="btn-primary px-5 py-2.5 rounded-xl text-sm"
                  >
                    <span>Neues Video</span>
                  </button>
                  <button
                    onClick={() => setShowUpgrade(true)}
                    className="btn-ghost px-5 py-2.5 rounded-xl text-sm"
                  >
                    Credits kaufen
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
      {pendingUpload && (
        <StyleModal
          upload={pendingUpload}
          onStarted={(id) => { setPendingUpload(null); handleJobStarted(id); }}
          onCancel={() => setPendingUpload(null)}
        />
      )}
    </>
  );
}
