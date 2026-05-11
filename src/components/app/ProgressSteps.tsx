"use client";

import { useEffect, useState } from "react";

type StepStatus = "waiting" | "active" | "done";

interface Step {
  label: string;
  sublabel: string;
  status: StepStatus;
}

const STEPS_SEQUENCE: Step[][] = [
  // 0 — upload
  [
    { label: "Upload", sublabel: "Video wird geladen…", status: "active" },
    { label: "Transkription", sublabel: "Wartet", status: "waiting" },
    { label: "Analyse", sublabel: "Wartet", status: "waiting" },
    { label: "Schnitt", sublabel: "Wartet", status: "waiting" },
    { label: "Fertig", sublabel: "Wartet", status: "waiting" },
  ],
  // 1 — transcription
  [
    { label: "Upload", sublabel: "Abgeschlossen", status: "done" },
    { label: "Transkription", sublabel: "Whisper transkribiert…", status: "active" },
    { label: "Analyse", sublabel: "Wartet", status: "waiting" },
    { label: "Schnitt", sublabel: "Wartet", status: "waiting" },
    { label: "Fertig", sublabel: "Wartet", status: "waiting" },
  ],
  // 2 — analysis
  [
    { label: "Upload", sublabel: "Abgeschlossen", status: "done" },
    { label: "Transkription", sublabel: "Abgeschlossen", status: "done" },
    { label: "Analyse", sublabel: "GPT-4o analysiert…", status: "active" },
    { label: "Schnitt", sublabel: "Wartet", status: "waiting" },
    { label: "Fertig", sublabel: "Wartet", status: "waiting" },
  ],
  // 3 — cutting
  [
    { label: "Upload", sublabel: "Abgeschlossen", status: "done" },
    { label: "Transkription", sublabel: "Abgeschlossen", status: "done" },
    { label: "Analyse", sublabel: "Abgeschlossen", status: "done" },
    { label: "Schnitt", sublabel: "FFmpeg schneidet…", status: "active" },
    { label: "Fertig", sublabel: "Wartet", status: "waiting" },
  ],
  // 4 — done
  [
    { label: "Upload", sublabel: "Abgeschlossen", status: "done" },
    { label: "Transkription", sublabel: "Abgeschlossen", status: "done" },
    { label: "Analyse", sublabel: "Abgeschlossen", status: "done" },
    { label: "Schnitt", sublabel: "Abgeschlossen", status: "done" },
    { label: "Fertig", sublabel: "5 Clips bereit", status: "done" },
  ],
];

export default function ProgressSteps({ autoPlay = true }: { autoPlay?: boolean }) {
  const [phase, setPhase] = useState(0);
  const steps = STEPS_SEQUENCE[Math.min(phase, STEPS_SEQUENCE.length - 1)];

  useEffect(() => {
    if (!autoPlay) return;
    if (phase >= STEPS_SEQUENCE.length - 1) return;
    const timings = [1200, 2400, 2000, 1800];
    const timer = setTimeout(() => setPhase((p) => p + 1), timings[phase] ?? 1500);
    return () => clearTimeout(timer);
  }, [phase, autoPlay]);

  return (
    <div className="glass rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <span className="text-sm font-medium text-chalk">Verarbeitungsstatus</span>
        {phase < STEPS_SEQUENCE.length - 1 ? (
          <span className="text-xs text-chalk-dim font-mono animate-pulse" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            {Math.round((phase / (STEPS_SEQUENCE.length - 1)) * 100)}%
          </span>
        ) : (
          <span className="text-xs text-emerald-400 font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            Fertig
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-white/5 rounded-full mb-6 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${(phase / (STEPS_SEQUENCE.length - 1)) * 100}%`,
            background: "linear-gradient(90deg, #7c3aed, #a855f7)",
          }}
        />
      </div>

      {/* Steps */}
      <div className="flex items-start justify-between relative">
        {/* Connector line */}
        <div className="absolute top-4 left-4 right-4 h-px bg-white/5 z-0" />

        {steps.map((step, i) => (
          <div key={step.label} className="relative z-10 flex flex-col items-center gap-2 flex-1">
            {/* Circle */}
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 ${
                step.status === "done"
                  ? "bg-violet"
                  : step.status === "active"
                  ? "bg-violet/20 border-2 border-violet"
                  : "bg-void-3 border border-white/10"
              }`}
            >
              {step.status === "done" ? (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2.5 6l3 3 4-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : step.status === "active" ? (
                <div className="w-2 h-2 rounded-full bg-violet animate-pulse" />
              ) : (
                <div className="w-2 h-2 rounded-full bg-white/20" />
              )}
            </div>

            {/* Labels */}
            <div className="text-center hidden sm:block">
              <div
                className={`text-xs font-medium transition-colors duration-300 ${
                  step.status === "done"
                    ? "text-violet-light"
                    : step.status === "active"
                    ? "text-chalk"
                    : "text-chalk-dim"
                }`}
              >
                {step.label}
              </div>
              <div className="text-[10px] text-chalk-dim mt-0.5 whitespace-nowrap">{step.sublabel}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
