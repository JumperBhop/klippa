"use client";

const plans = [
  {
    id: "gratis",
    name: "Gratis",
    tagline: "Zum Ausprobieren",
    price: "0",
    credits: 3,
    glow: null as string | null,
    badge: null as string | null,
    color: "#6b7280",
    features: [
      "3 Gratis-Credits",
      "Max. 30-Min.-Videos",
      "3 Clips pro Video",
      "780p Download",
      "Wasserzeichen auf Clips",
    ],
    cta: "Kostenlos starten",
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "Für Creators",
    price: "9",
    credits: 20,
    glow: "violet",
    badge: "Beliebt",
    color: "#a855f7",
    features: [
      "20 Credits pro Monat",
      "Max. 1-Std.-Videos",
      "5 Clips pro Video",
      "Full HD Download",
      "Kein Wasserzeichen",
      "Alle Untertitel-Styles",
    ],
    cta: "Pro starten",
  },
  {
    id: "star",
    name: "Star",
    tagline: "Für Profis",
    price: "25",
    credits: 100,
    glow: "amber",
    badge: "⭐ Premium",
    color: "#f59e0b",
    features: [
      "100 Credits pro Monat",
      "Max. 4-Std.-Videos",
      "7 Clips pro Video",
      "4K Download",
      "Kein Wasserzeichen",
      "Alle Untertitel-Styles",
      "Priorität-Verarbeitung",
    ],
    cta: "Star starten",
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="relative py-24 md:py-32 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-20">
          <div className="reveal inline-flex items-center gap-2 glass-violet px-4 py-2 rounded-full mb-6">
            <span
              className="text-xs font-mono tracking-widest uppercase text-violet-light"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              Preise & Credits
            </span>
          </div>
          <h2
            className="reveal font-display font-bold text-chalk"
            style={{ fontFamily: "'Clash Display', sans-serif", fontSize: "clamp(2.5rem, 5vw, 4.5rem)" }}
            data-delay="80"
          >
            Einfach.
            <span className="gradient-text"> Transparent.</span>
          </h2>
          <p className="reveal text-chalk-dim mt-4 max-w-md mx-auto" data-delay="120">
            Credits werden nur beim Verarbeiten verbraucht — nicht beim Speichern oder Runterladen.
          </p>
        </div>

        {/* Pricing grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <div key={plan.id} className="reveal reveal-scale relative" data-delay={`${i * 100}`}>
              {/* Animated glow behind Pro/Star */}
              {plan.glow && (
                <div
                  className="absolute -inset-[3px] rounded-[20px]"
                  style={{
                    background: plan.glow === "violet"
                      ? "linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #6d28d9 100%)"
                      : "linear-gradient(135deg, #f59e0b 0%, #fbbf24 50%, #d97706 100%)",
                    filter: "blur(8px)",
                    animation: "pulseOpacity 2.5s ease-in-out infinite",
                  }}
                />
              )}

              <div
                className="relative flex flex-col rounded-2xl overflow-hidden border h-full"
                style={{
                  borderColor: plan.glow === "violet"
                    ? "rgba(168,85,247,0.5)"
                    : plan.glow === "amber"
                    ? "rgba(251,191,36,0.4)"
                    : "rgba(255,255,255,0.07)",
                  background: plan.glow === "violet"
                    ? "linear-gradient(145deg, rgba(20,8,40,1) 0%, rgba(12,10,20,1) 100%)"
                    : plan.glow === "amber"
                    ? "linear-gradient(145deg, rgba(28,18,4,1) 0%, rgba(12,11,9,1) 100%)"
                    : "rgba(255,255,255,0.03)",
                }}
              >
                {/* Top shimmer */}
                {plan.glow === "violet" && (
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-light to-transparent" />
                )}
                {plan.glow === "amber" && (
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent" />
                )}

                {plan.badge && (
                  <div className="absolute top-4 right-4">
                    <span
                      className="text-[10px] font-mono px-2.5 py-1 rounded-full"
                      style={{ color: plan.color, background: `${plan.color}20`, border: `1px solid ${plan.color}44` }}
                    >
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="p-8 flex flex-col flex-1">
                  {/* Plan name */}
                  <div className="mb-6">
                    <div className="font-bold text-chalk text-xl mb-0.5" style={{ fontFamily: "'Clash Display', sans-serif" }}>
                      {plan.name}
                    </div>
                    <div className="text-xs text-chalk-dim">{plan.tagline}</div>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-end gap-1">
                      {plan.price === "0" ? (
                        <span className="font-bold text-4xl text-chalk-dim" style={{ fontFamily: "'Clash Display', sans-serif" }}>
                          0 €
                        </span>
                      ) : (
                        <>
                          <span className="font-bold text-4xl text-chalk" style={{ fontFamily: "'Clash Display', sans-serif" }}>
                            {plan.price}€
                          </span>
                          <span className="text-chalk-dim text-sm mb-1">/ Monat</span>
                        </>
                      )}
                    </div>
                    <div className="mt-2 inline-flex items-center gap-1.5 glass px-3 py-1 rounded-full">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: plan.color }} />
                      <span className="text-xs text-chalk-dim">
                        <span className="font-semibold" style={{ color: plan.color }}>{plan.credits}</span> Credits
                      </span>
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="flex flex-col gap-3 mb-8 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-chalk-dim">
                        <svg className="mt-0.5 flex-shrink-0" width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M3 7l3 3 5-5" stroke={plan.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <button
                    className={`w-full py-3 rounded-xl text-sm font-semibold transition-all ${plan.glow ? "btn-primary" : "btn-ghost"}`}
                    style={plan.glow ? { boxShadow: `0 0 20px ${plan.color}44` } : {}}
                  >
                    <span>{plan.cta}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Credit info */}
        <div className="reveal mt-12 glass rounded-xl p-6 max-w-2xl mx-auto text-center" data-delay="100">
          <div className="text-xs font-mono tracking-widest uppercase text-violet mb-3" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            Wie Credits funktionieren
          </div>
          <p className="text-chalk-dim text-sm leading-relaxed">
            1 Credit = 1 verarbeitetes Video (inklusive aller Clips). Credits verfallen nicht.
          </p>
        </div>
      </div>
    </section>
  );
}
