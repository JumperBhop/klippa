"use client";

import { useState } from "react";
import type { Clip } from "./ClipCard";

const SUBTITLE_STYLES = [
  { id: "tiktok-bold", label: "TikTok Bold", preview: "BOLD" },
  { id: "minimal-white", label: "Minimal White", preview: "clean" },
  { id: "neon-glow", label: "Neon Glow", preview: "glow" },
  { id: "karaoke", label: "Karaoke", preview: "kara" },
  { id: "word-pop", label: "Word Pop", preview: "pop" },
];

const FILTERS = [
  { id: "cinematic", label: "Cinematic", color: "#4f46e5" },
  { id: "vibrant", label: "Vibrant", color: "#ec4899" },
  { id: "bw", label: "B&W", color: "#6b7280" },
  { id: "warm", label: "Warm", color: "#f59e0b" },
  { id: "cool", label: "Cool", color: "#06b6d4" },
];

const MUSIC_TRACKS = [
  { id: "none", label: "Kein Hintergrund", duration: "" },
  { id: "hype-1", label: "Hype Beats Vol. 1", duration: "2:30" },
  { id: "chill-2", label: "Lo-Fi Chill", duration: "3:12" },
  { id: "cinematic-3", label: "Epic Cinematic", duration: "1:45" },
  { id: "dark-4", label: "Dark Ambient", duration: "4:00" },
];

const TEXT_SIZES = ["Klein", "Mittel", "Groß"];
const TEXT_POSITIONS = ["Oben", "Mitte", "Unten"];

export default function CustomizationPanel({ clip, onClose }: { clip: Clip; onClose: () => void }) {
  const [subtitleStyle, setSubtitleStyle] = useState("tiktok-bold");
  const [filter, setFilter] = useState("cinematic");
  const [textSize, setTextSize] = useState("Mittel");
  const [textPosition, setTextPosition] = useState("Unten");
  const [music, setMusic] = useState("none");

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative z-10 glass-strong rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 sticky top-0 glass-strong">
          <div>
            <h3 className="font-display font-semibold text-chalk" style={{ fontFamily: "'Clash Display', sans-serif" }}>
              Clip anpassen
            </h3>
            <p className="text-xs text-chalk-dim mt-0.5 truncate max-w-xs">{clip.title}</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 glass rounded-lg flex items-center justify-center text-chalk-dim hover:text-chalk transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="p-6 flex flex-col gap-8">
          {/* Subtitle style */}
          <Section label="Untertitel-Style">
            <div className="flex flex-wrap gap-2">
              {SUBTITLE_STYLES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSubtitleStyle(s.id)}
                  className={`px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                    subtitleStyle === s.id
                      ? "bg-violet text-white border border-violet"
                      : "glass text-chalk-dim border border-white/5 hover:border-violet/30"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </Section>

          {/* Filter */}
          <Section label="Filter">
            <div className="flex gap-3">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`flex flex-col items-center gap-2 transition-all duration-200 ${
                    filter === f.id ? "opacity-100 scale-105" : "opacity-50 hover:opacity-75"
                  }`}
                >
                  <div
                    className="w-12 h-12 rounded-xl"
                    style={{ background: `linear-gradient(135deg, ${f.color}88, ${f.color}22)`, border: filter === f.id ? `2px solid ${f.color}` : "2px solid transparent" }}
                  />
                  <span className="text-[10px] text-chalk-dim">{f.label}</span>
                </button>
              ))}
            </div>
          </Section>

          {/* Text size & position */}
          <div className="grid grid-cols-2 gap-6">
            <Section label="Textgröße">
              <div className="flex gap-1.5">
                {TEXT_SIZES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setTextSize(s)}
                    className={`flex-1 py-2 rounded-lg text-xs transition-all duration-200 ${
                      textSize === s ? "bg-violet text-white" : "glass text-chalk-dim hover:text-chalk"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </Section>

            <Section label="Position">
              <div className="flex gap-1.5">
                {TEXT_POSITIONS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setTextPosition(p)}
                    className={`flex-1 py-2 rounded-lg text-xs transition-all duration-200 ${
                      textPosition === p ? "bg-violet text-white" : "glass text-chalk-dim hover:text-chalk"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </Section>
          </div>

          {/* Background music */}
          <Section label="Hintergrundmusik">
            <div className="flex flex-col gap-1.5">
              {MUSIC_TRACKS.map((track) => (
                <button
                  key={track.id}
                  onClick={() => setMusic(track.id)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all duration-200 ${
                    music === track.id
                      ? "glass-violet border border-violet/30 text-chalk"
                      : "glass text-chalk-dim border border-transparent hover:border-white/10"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border-2 transition-all ${music === track.id ? "border-violet bg-violet/50" : "border-white/20"}`} />
                    {track.label}
                  </div>
                  {track.duration && (
                    <span className="text-xs text-chalk-dim font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {track.duration}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </Section>

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="btn-ghost flex-1 py-3 rounded-xl text-sm">
              Abbrechen
            </button>
            <button className="btn-primary flex-1 py-3 rounded-xl text-sm">
              <span>Exportieren</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div
        className="text-xs font-mono tracking-widest uppercase text-violet mb-3"
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}
