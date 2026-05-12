"use client";

import { useRef, useState } from "react";
import type { Clip } from "./ClipCard";

const SUBTITLE_STYLES = [
  { id: "tiktok-bold",   label: "TikTok Bold" },
  { id: "minimal-white", label: "Minimal" },
  { id: "neon-glow",     label: "Neon Glow" },
  { id: "karaoke",       label: "Karaoke" },
  { id: "word-pop",      label: "Word Pop" },
];

const PRESET_COLORS = [
  "#ffffff", "#ffe500", "#00ffff", "#39ff14",
  "#ff3333", "#ff8c00", "#a855f7", "#ff44aa",
];

function getPreviewStyle(styleId: string, color: string): React.CSSProperties {
  const shadow = `0 0 10px ${color}cc, 0 0 22px ${color}66`;
  switch (styleId) {
    case "tiktok-bold":
      return { color, fontWeight: 900, fontSize: "15px", textTransform: "uppercase", letterSpacing: "0.02em", textShadow: "2px 2px 0 #000,-2px -2px 0 #000,2px -2px 0 #000,-2px 2px 0 #000" };
    case "minimal-white":
      return { color, fontWeight: 400, fontSize: "13px", letterSpacing: "0.05em" };
    case "neon-glow":
      return { color, fontWeight: 700, fontSize: "14px", textShadow: shadow };
    case "karaoke":
      return { color, fontWeight: 700, fontSize: "14px", textShadow: "2px 2px 0 #000,-1px -1px 0 #000" };
    case "word-pop":
      return { color, fontWeight: 900, fontSize: "16px", textShadow: `3px 3px 0 #7c3aed` };
    default:
      return { color, fontWeight: 700, fontSize: "14px" };
  }
}

export default function CustomizationPanel({ clip, onClose }: { clip: Clip; onClose: () => void }) {
  const [subtitleStyle, setSubtitleStyle] = useState("tiktok-bold");
  const [textColor, setTextColor] = useState("#ffffff");
  const colorInputRef = useRef<HTMLInputElement>(null);

  const previewStyle = getPreviewStyle(subtitleStyle, textColor);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div
        className="relative z-10 glass-strong rounded-2xl w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-px bg-gradient-to-r from-transparent via-violet to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 sticky top-0 glass-strong border-b border-white/5">
          <div>
            <h3 className="font-bold text-chalk" style={{ fontFamily: "'Clash Display', sans-serif" }}>
              Clip anpassen
            </h3>
            <p className="text-xs text-chalk-dim mt-0.5 truncate max-w-xs">{clip.title}</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 glass rounded-lg flex items-center justify-center text-chalk-dim hover:text-chalk transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-6 max-h-[70vh] overflow-y-auto">

          {/* Live Preview */}
          <div
            className="relative rounded-xl overflow-hidden"
            style={{ background: "linear-gradient(160deg, #1a0a2e 0%, #0d0d1a 50%, #080810 100%)", height: "120px" }}
          >
            <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 2px,#fff 2px,#fff 3px)", backgroundSize: "100% 3px" }} />
            <div className="absolute top-2 left-3 text-[9px] font-mono text-white/25 tracking-widest uppercase" style={{ fontFamily: "'JetBrains Mono',monospace" }}>
              Vorschau
            </div>
            <div className="absolute bottom-5 left-0 right-0 flex justify-center px-4">
              <span className="text-center leading-tight" style={{ fontFamily: "'Inter',sans-serif", ...previewStyle }}>
                Klippa macht virale Shorts
              </span>
            </div>
            <div className="absolute bottom-1.5 right-3 text-[8px] text-white/30">klippa.de</div>
          </div>

          {/* Subtitle Style */}
          <Section label="Untertitel-Style">
            <div className="flex flex-wrap gap-2">
              {SUBTITLE_STYLES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSubtitleStyle(s.id)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-all duration-200 border ${
                    subtitleStyle === s.id
                      ? "bg-violet/20 border-violet/50 text-chalk"
                      : "glass border-white/5 text-chalk-dim hover:border-violet/20 hover:text-chalk"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </Section>

          {/* Text Color */}
          <Section label="Textfarbe">
            <div className="flex items-center gap-2 flex-wrap">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setTextColor(c)}
                  className="relative w-8 h-8 rounded-full transition-all duration-200 flex-shrink-0"
                  style={{ backgroundColor: c, boxShadow: textColor === c ? `0 0 0 2px #0d0d1a, 0 0 0 4px ${c}` : "none", transform: textColor === c ? "scale(1.15)" : "scale(1)" }}
                  title={c}
                />
              ))}

              {/* Custom color picker */}
              <button
                onClick={() => colorInputRef.current?.click()}
                className="relative w-8 h-8 rounded-full glass border border-white/20 flex items-center justify-center transition-all duration-200 hover:border-violet/40 flex-shrink-0"
                title="Eigene Farbe"
                style={!PRESET_COLORS.includes(textColor) ? { boxShadow: `0 0 0 2px #0d0d1a, 0 0 0 4px ${textColor}`, backgroundColor: textColor, transform: "scale(1.15)" } : {}}
              >
                {PRESET_COLORS.includes(textColor) && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                )}
              </button>
              <input
                ref={colorInputRef}
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="sr-only"
              />

              {/* Current color display */}
              <div className="ml-1 glass rounded-lg px-3 py-1.5 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: textColor }} />
                <span className="text-[10px] font-mono text-chalk-dim" style={{ fontFamily: "'JetBrains Mono',monospace" }}>
                  {textColor.toUpperCase()}
                </span>
              </div>
            </div>
          </Section>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3 border-t border-white/5 pt-4">
          <button onClick={onClose} className="btn-ghost flex-1 py-3 rounded-xl text-sm">
            Schließen
          </button>
          <button className="btn-primary flex-1 py-3 rounded-xl text-sm violet-glow">
            <span>Exportieren</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] font-mono tracking-widest uppercase text-violet mb-2.5" style={{ fontFamily: "'JetBrains Mono',monospace" }}>
        {label}
      </div>
      {children}
    </div>
  );
}
