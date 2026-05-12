"use client";

import { useState } from "react";
import CustomizationPanel from "./CustomizationPanel";

const API = "https://178.105.137.126.nip.io";

export interface Clip {
  id: string;
  title: string;
  viralScore: number;
  reason: string;
  duration: string;
  thumbnail?: string;
  timeCode?: string;
  download_url?: string;
}

export default function ClipCard({ clip }: { clip: Clip }) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [playing, setPlaying] = useState(false);

  const videoUrl = clip.download_url ? `${API}${clip.download_url}` : null;

  return (
    <>
      <div className="clip-card glass rounded-2xl overflow-hidden flex flex-col group">
        {/* Thumbnail / Player */}
        <div className="relative aspect-[9/16] bg-void-3 overflow-hidden">
          {playing && videoUrl ? (
            <video
              src={videoUrl}
              autoPlay
              controls
              className="absolute inset-0 w-full h-full object-cover"
              onEnded={() => setPlaying(false)}
            />
          ) : (
            <>
              <div
                className="absolute inset-0"
                style={{ background: `linear-gradient(135deg, ${clip.thumbnail}22 0%, #0a0a0a 100%)` }}
              />
              <button
                onClick={() => setPlaying(true)}
                className="absolute inset-0 flex items-center justify-center group/play"
                style={{ background: `radial-gradient(circle at center, ${clip.thumbnail}33 0%, transparent 70%)` }}
              >
                <div className="w-12 h-12 glass-violet rounded-full flex items-center justify-center transition-transform duration-200 group-hover/play:scale-110">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M6 4.5l9 4.5-9 4.5V4.5z" fill="#a855f7"/>
                  </svg>
                </div>
              </button>
            </>
          )}

          {/* Timecode */}
          {!playing && (
            <div className="absolute bottom-2 right-2 glass px-2 py-1 rounded-md">
              <span className="text-[10px] text-chalk font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {clip.duration}
              </span>
            </div>
          )}

          {/* Viral score badge */}
          <div className="absolute top-2 left-2 viral-score px-2.5 py-1 rounded-lg">
            <span className="text-xs font-bold text-white" style={{ fontFamily: "'Clash Display', sans-serif" }}>
              {clip.viralScore}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col gap-3 flex-1">
          <div>
            <h3 className="text-sm font-semibold text-chalk leading-snug mb-1 line-clamp-2">{clip.title}</h3>
            <span className="text-xs text-chalk-dim font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {clip.timeCode}
            </span>
          </div>

          {/* AI reason */}
          <div className="glass-violet rounded-lg p-3">
            <div className="flex items-start gap-2">
              <svg className="mt-0.5 flex-shrink-0" width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 1l1.5 3 3 .5-2.2 2.1.5 3L6 8l-2.8 1.6.5-3L1.5 4.5l3-.5L6 1z" fill="#a855f7"/>
              </svg>
              <p className="text-[11px] text-chalk-dim leading-relaxed">{clip.reason}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-auto">
            <button
              onClick={() => setPanelOpen(true)}
              className="btn-ghost flex-1 py-2 rounded-lg text-xs flex items-center justify-center gap-1.5"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <circle cx="6" cy="6" r="2" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M6 1v2M6 9v2M1 6h2M9 6h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              Anpassen
            </button>
            {videoUrl && (
              <a
                href={videoUrl}
                download
                className="btn-primary py-2 px-4 rounded-lg text-xs flex items-center gap-1.5"
              >
                <span className="flex items-center gap-1.5">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M6 1v7M3 6l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 10h8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                  </svg>
                  Download
                </span>
              </a>
            )}
          </div>
        </div>
      </div>

      {panelOpen && (
        <CustomizationPanel clip={clip} onClose={() => setPanelOpen(false)} />
      )}
    </>
  );
}
