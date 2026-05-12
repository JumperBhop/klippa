"use client";

import { useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { processJob, type StyleSettings } from "@/lib/api";

const SUBTITLE_STYLES = [
  { id: "tiktok-bold",   label: "TikTok Bold",  previewWeight: 900, previewTransform: "uppercase" as const },
  { id: "minimal-white", label: "Minimal",       previewWeight: 400, previewTransform: "none" as const },
];

const PRESET_COLORS = [
  { hex: "#ffffff", label: "Weiß" },
  { hex: "#ffe500", label: "Gelb" },
  { hex: "#00ffff", label: "Cyan" },
  { hex: "#39ff14", label: "Grün" },
  { hex: "#ff3333", label: "Rot" },
  { hex: "#ff8c00", label: "Orange" },
  { hex: "#a855f7", label: "Lila" },
  { hex: "#ff44aa", label: "Pink" },
];

function buildPreviewStyle(styleId: string, color: string): React.CSSProperties {
  const glow = `0 0 8px ${color}cc, 0 0 18px ${color}66`;
  const outline = "1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000";
  switch (styleId) {
    case "tiktok-bold":
      return { color, fontWeight: 900, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", textShadow: outline };
    case "minimal-white":
      return { color, fontWeight: 400, fontSize: "12px", letterSpacing: "0.04em" };
    case "karaoke":
      return { color, fontWeight: 700, fontSize: "12px", textShadow: outline };
    case "word-pop":
      return { color, fontWeight: 900, fontSize: "13px", textShadow: `2px 2px 0 #7c3aed` };
    default:
      return { color, fontWeight: 700, fontSize: "12px" };
  }
}

interface Props {
  upload: { job_id?: string; youtube_url?: string };
  onStarted: (jobId: string) => void;
  onCancel: () => void;
}

export default function StyleModal({ upload, onStarted, onCancel }: Props) {
  const { user } = useUser();
  const [subtitleStyle, setSubtitleStyle] = useState("tiktok-bold");
  const [textColor, setTextColor] = useState("#ffffff");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const colorPickerRef = useRef<HTMLInputElement>(null);

  const previewStyle = buildPreviewStyle(subtitleStyle, textColor);

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    try {
      const style: StyleSettings = {
        subtitle_style: subtitleStyle,
        text_color: textColor,
        watermark: true,
      };
      const { job_id } = await processJob({ ...upload, user_id: user?.id, style });
      onStarted(job_id);
    } catch (e: any) {
      setError(e.message ?? "Fehler beim Starten");
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      onClick={!loading ? onCancel : undefined}
    >
      <div className="absolute inset-0 bg-black/75 backdrop-blur-md" />

      <div
        className="relative z-10 glass-strong rounded-2xl w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-px bg-gradient-to-r from-transparent via-violet to-transparent" />

        {/* Header */}
        <div className="px-6 pt-5 pb-4 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-5 h-5 rounded-md glass-violet flex items-center justify-center">
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                  <path d="M6 1l1.5 3 3 .5-2.2 2.1.5 3L6 8l-2.8 1.6.5-3L1.5 4.5l3-.5L6 1z" fill="#a855f7" />
                </svg>
              </div>
              <span className="text-[10px] font-mono tracking-widest uppercase text-violet" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                Schritt 2 von 2
              </span>
            </div>
            <h3 className="font-bold text-chalk text-lg" style={{ fontFamily: "'Clash Display', sans-serif" }}>
              Wie sollen deine Clips aussehen?
            </h3>
            <p className="text-xs text-chalk-dim mt-0.5">Wähle deinen Style — du kannst das später anpassen</p>
          </div>
          {!loading && (
            <button
              onClick={onCancel}
              className="w-8 h-8 glass rounded-lg flex items-center justify-center text-chalk-dim hover:text-chalk transition-colors flex-shrink-0 ml-4 mt-1"
            >
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>

        <div className="px-6 pb-6 flex flex-col gap-5">
          {error && (
            <div className="glass rounded-xl px-4 py-3 border border-red-500/30 text-red-400 text-xs">{error}</div>
          )}

          {/* Live Preview */}
          <div
            className="relative rounded-xl overflow-hidden flex items-end justify-center pb-4"
            style={{ background: "linear-gradient(160deg, #1a0a2e 0%, #0d0d1a 50%, #080810 100%)", height: "90px" }}
          >
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 2px,#fff 2px,#fff 3px)", backgroundSize: "100% 3px" }} />
            <div className="absolute top-2 left-3 text-[9px] font-mono text-white/25 tracking-widest uppercase" style={{ fontFamily: "'JetBrains Mono',monospace" }}>
              Vorschau
            </div>
            {/* Centered preview text */}
            <span
              className="relative z-10 text-center leading-tight"
              style={{ fontFamily: "'Inter', sans-serif", ...previewStyle }}
            >
              Klippa macht virale Shorts
            </span>
            <div className="absolute bottom-1 right-2 text-[8px] text-white/30">klippa.de</div>
          </div>

          {/* Subtitle style */}
          <ModalSection label="Untertitel-Style">
            <div className="grid grid-cols-2 gap-1.5">
              {SUBTITLE_STYLES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSubtitleStyle(s.id)}
                  className={`py-2 px-1 rounded-xl border transition-all duration-200 text-center ${
                    subtitleStyle === s.id
                      ? "border-violet/60 bg-violet/15"
                      : "glass border-white/5 hover:border-violet/20"
                  }`}
                >
                  <span
                    className="block leading-tight text-center"
                    style={{
                      fontSize: "11px",
                      fontWeight: s.previewWeight,
                      textTransform: s.previewTransform,
                      color: subtitleStyle === s.id ? textColor : "#a0a0a0",
                    }}
                  >
                    {s.id === "tiktok-bold" ? "BOLD" : "clean"}
                  </span>
                  <span className="text-[9px] text-chalk-dim mt-0.5 block">{s.label}</span>
                </button>
              ))}
            </div>
          </ModalSection>

          {/* Text color */}
          <ModalSection label="Textfarbe">
            <div className="flex items-center gap-2 flex-wrap">
              {PRESET_COLORS.map(({ hex, label }) => (
                <button
                  key={hex}
                  onClick={() => setTextColor(hex)}
                  title={label}
                  className="w-8 h-8 rounded-full flex-shrink-0 transition-all duration-150"
                  style={{
                    backgroundColor: hex,
                    boxShadow: textColor === hex ? `0 0 0 2px #0d0d1a, 0 0 0 3.5px ${hex}` : "none",
                    transform: textColor === hex ? "scale(1.18)" : "scale(1)",
                  }}
                />
              ))}

              {/* Custom color */}
              <button
                onClick={() => colorPickerRef.current?.click()}
                title="Eigene Farbe"
                className="w-8 h-8 rounded-full flex-shrink-0 transition-all duration-150 border border-white/20 flex items-center justify-center"
                style={
                  !PRESET_COLORS.some((c) => c.hex === textColor)
                    ? { backgroundColor: textColor, boxShadow: `0 0 0 2px #0d0d1a, 0 0 0 3.5px ${textColor}`, transform: "scale(1.18)" }
                    : { background: "rgba(255,255,255,0.06)" }
                }
              >
                {PRESET_COLORS.some((c) => c.hex === textColor) && (
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                    <path d="M6 1v10M1 6h10" stroke="#a0a0a0" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                )}
              </button>
              <input
                ref={colorPickerRef}
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="sr-only"
              />

              {/* HEX display */}
              <div className="glass rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 ml-auto">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: textColor }} />
                <span className="text-[10px] font-mono text-chalk-dim" style={{ fontFamily: "'JetBrains Mono',monospace" }}>
                  {textColor.toUpperCase()}
                </span>
              </div>
            </div>
          </ModalSection>
        </div>

        {/* CTA */}
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onCancel} disabled={loading} className="btn-ghost px-5 py-3 rounded-xl text-sm disabled:opacity-40">
            Zurück
          </button>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="btn-primary flex-1 py-3 rounded-xl text-sm font-semibold violet-glow disabled:opacity-60 relative overflow-hidden"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="40" strokeDashoffset="15" />
                </svg>
                Startet…
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1l1.8 3.6 3.6.6-2.6 2.5.6 3.6L7 9.5l-2.4 1.8.6-3.6L2.6 5.2l3.6-.6L7 1z" fill="currentColor" />
                </svg>
                Clips generieren
              </span>
            )}
            {!loading && (
              <div className="absolute inset-0 -translate-x-full" style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)", animation: "shimmer 2.5s infinite" }} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] font-mono tracking-widest uppercase text-violet mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        {label}
      </div>
      {children}
    </div>
  );
}
