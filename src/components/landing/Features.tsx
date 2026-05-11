const features = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path d="M14 4v8M14 4l-3 3M14 4l3 3" stroke="#a855f7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        <rect x="3" y="14" width="22" height="10" rx="3" stroke="#a855f7" strokeWidth="1.5"/>
        <path d="M8 19h12" stroke="#a855f7" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    step: "01",
    title: "Video hochladen",
    description:
      "Drag & Drop oder YouTube-Link einfügen. Klippa akzeptiert MP4, MOV, WebM — bis zu 4K. Kein Vorschneiden nötig.",
    accent: "Upload",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <circle cx="14" cy="14" r="10" stroke="#a855f7" strokeWidth="1.5"/>
        <path d="M9 14l3.5 3.5L19 10" stroke="#a855f7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M14 4c0 0 4 2 4 10s-4 10-4 10" stroke="#7c3aed" strokeWidth="1" strokeDasharray="2 2"/>
      </svg>
    ),
    step: "02",
    title: "KI analysiert & schneidet",
    description:
      "Whisper transkribiert, GPT-4o findet virale Momente. Jeder Clip bekommt einen Viral-Score und eine KI-Begründung.",
    accent: "Analyse",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect x="4" y="6" width="13" height="18" rx="2" stroke="#a855f7" strokeWidth="1.5"/>
        <path d="M17 10h3a2 2 0 012 2v6a2 2 0 01-2 2h-3" stroke="#a855f7" strokeWidth="1.5"/>
        <path d="M10 22v3M10 22l-2 3M10 22l2 3" stroke="#7c3aed" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    ),
    step: "03",
    title: "Anpassen & herunterladen",
    description:
      "Wähle Untertitel-Style, Filter und Musik. Lade einzeln oder alle als ZIP — fertig für TikTok, Reels und YouTube Shorts.",
    accent: "Download",
  },
];

export default function Features() {
  return (
    <section id="features" className="relative py-24 md:py-32 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-20">
          <div className="reveal inline-flex items-center gap-2 glass-violet px-4 py-2 rounded-full mb-6">
            <span
              className="text-xs font-mono tracking-widest uppercase text-violet-light"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              Wie es funktioniert
            </span>
          </div>
          <h2
            className="reveal font-display font-bold text-chalk leading-tight"
            style={{
              fontFamily: "'Clash Display', sans-serif",
              fontSize: "clamp(2.5rem, 5vw, 4.5rem)",
            }}
            data-delay="80"
          >
            Drei Schritte.
            <br />
            <span className="gradient-text">Kein Aufwand.</span>
          </h2>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/5 rounded-2xl overflow-hidden">
          {features.map((f, i) => (
            <div
              key={f.step}
              className="reveal glass group relative p-8 flex flex-col gap-6 hover:bg-white/[0.04] transition-colors duration-300"
              style={{ transitionDelay: `${i * 100}ms` }}
              data-delay={`${i * 100}`}
            >
              {/* Step number */}
              <div className="absolute top-6 right-6">
                <span
                  className="font-display font-bold text-5xl text-white/5 group-hover:text-white/10 transition-colors duration-500 select-none"
                  style={{ fontFamily: "'Clash Display', sans-serif" }}
                >
                  {f.step}
                </span>
              </div>

              {/* Icon */}
              <div className="w-14 h-14 glass-violet rounded-xl flex items-center justify-center flex-shrink-0">
                {f.icon}
              </div>

              {/* Content */}
              <div>
                <div className="text-xs font-mono tracking-widest uppercase text-violet mb-3" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {f.accent}
                </div>
                <h3
                  className="font-display font-semibold text-chalk text-xl mb-3"
                  style={{ fontFamily: "'Clash Display', sans-serif" }}
                >
                  {f.title}
                </h3>
                <p className="text-chalk-dim text-sm leading-relaxed">{f.description}</p>
              </div>

              {/* Bottom accent line */}
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
          ))}
        </div>

        {/* Visual demo placeholder */}
        <div className="reveal mt-16 glass rounded-2xl overflow-hidden aspect-video max-w-4xl mx-auto relative" data-delay="100">
          <div className="absolute inset-0 grid-bg opacity-50" />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <div className="w-20 h-20 glass-violet rounded-2xl flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <path d="M8 7l18 9-18 9V7z" fill="#a855f7"/>
              </svg>
            </div>
            <span className="text-chalk-dim text-sm tracking-wide">Video-Demo folgt bald</span>
          </div>
          <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3">
            <div className="h-1 flex-1 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full w-1/3 bg-gradient-to-r from-violet to-violet-light rounded-full" />
            </div>
            <span className="text-xs text-chalk-dim font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>1:24 / 4:02</span>
          </div>
        </div>
      </div>
    </section>
  );
}
