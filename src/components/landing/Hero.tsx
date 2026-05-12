"use client";

import Link from "next/link";

export default function Hero() {
  return (
    /* overflow-clip statt overflow-hidden: kein Clipping des normalen Layouts,
       nur echte overflow-Elemente werden abgeschnitten */
    <section className="relative min-h-screen flex flex-col items-center justify-center grid-bg" style={{ overflow: "clip" }}>
      {/* Innenabstand über Kinder, nie über section selbst — verhindert Clipping */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-24 flex flex-col items-center">

        {/* Scan line — contained within section */}
        <div
          className="pointer-events-none fixed left-0 right-0 h-px z-10"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(124,58,237,0.5), transparent)",
            animation: "scanLine 4s linear infinite",
            opacity: 0.04,
          }}
          aria-hidden="true"
        />


        {/* Headline */}
        <div className="reveal text-center w-full" data-delay="80">
          <h1
            className="font-bold leading-[1.05] tracking-tight mb-6"
            style={{
              fontFamily: "'Clash Display', sans-serif",
              fontSize: "clamp(2.8rem, 8vw, 7.5rem)",
              letterSpacing: "-0.01em",
            }}
          >
            <span className="text-chalk block">Video rein.</span>
            <span className="block gradient-text" style={{ letterSpacing: "-0.02em" }}>
              Virale Shorts
            </span>
            <span className="text-chalk block">raus.</span>
          </h1>

          <p
            className="text-lg md:text-xl max-w-xl mx-auto leading-relaxed mb-10"
            style={{ fontFamily: "'Syne', sans-serif", color: "#a0a0a0" }}
          >
            Klippa analysiert dein Video mit KI, findet die besten Momente und
            schneidet automatisch Short-Clips — fertig zum Posten.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="magnetic-wrap">
              <Link href="/app">
                <button className="btn-primary px-8 py-4 rounded-xl text-base violet-glow">
                  <span className="flex items-center gap-2">
                    Kostenlos starten
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                </button>
              </Link>
            </div>
            <div className="magnetic-wrap">
              <button className="btn-ghost px-8 py-4 rounded-xl text-base flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <circle cx="9" cy="9" r="7.5" stroke="currentColor" strokeWidth="1.2"/>
                  <path d="M7 6.5l5 2.5-5 2.5V6.5z" fill="currentColor"/>
                </svg>
                Demo ansehen
              </button>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="reveal mt-20 w-full max-w-md mx-auto" data-delay="200">
          {/* gap-px trick: parent has bg color, children are solid — simulates dividers */}
          <div className="flex rounded-xl overflow-hidden border border-white/5">
            {[
              { value: "10x", label: "schneller" },
              { value: "97%", label: "Zeitersparnis" },
              { value: "3 Min.", label: "bis zum fertigen Clip" },
            ].map((stat, i) => (
              <div
                key={stat.label}
                className={`flex-1 glass p-5 text-center ${i > 0 ? "border-l border-white/5" : ""}`}
              >
                <div
                  className="font-bold text-2xl gradient-text mb-1"
                  style={{ fontFamily: "'Clash Display', sans-serif" }}
                >
                  {stat.value}
                </div>
                <div className="text-xs tracking-wide" style={{ color: "#a0a0a0" }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </section>
  );
}
