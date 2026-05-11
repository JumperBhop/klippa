const plans = [
  {
    name: "Starter",
    tagline: "Zum Ausprobieren",
    price: "0",
    priceLabel: "Gratis",
    credits: 10,
    features: [
      "10 Credits geschenkt",
      "Max. 30-Min.-Videos",
      "Bis zu 5 Clips pro Video",
      "Standard-Untertitel",
      "720p Download",
    ],
    cta: "Kostenlos starten",
    highlight: false,
  },
  {
    name: "Pro",
    tagline: "Für Creators",
    price: "9",
    priceLabel: "/ Monat",
    credits: 49,
    features: [
      "49 Credits pro Monat",
      "Unbegrenzte Videolänge",
      "Bis zu 20 Clips pro Video",
      "Alle Untertitel-Styles",
      "4K Download",
      "Hintergrundmusik-Bibliothek",
      "Priorität-Verarbeitung",
    ],
    cta: "Pro starten",
    highlight: true,
  },
  {
    name: "Unlimited",
    tagline: "Kein Limit",
    price: "29",
    priceLabel: "/ Monat",
    credits: null,
    features: [
      "Unbegrenzte Credits",
      "Unbegrenzte Videolänge",
      "Unbegrenzte Clips",
      "Alle Pro-Features",
      "API-Zugang",
      "White-Label Export",
      "Dedicated Support",
    ],
    cta: "Unlimited starten",
    highlight: false,
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
            style={{
              fontFamily: "'Clash Display', sans-serif",
              fontSize: "clamp(2.5rem, 5vw, 4.5rem)",
            }}
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <div
              key={plan.name}
              className={`reveal reveal-scale relative flex flex-col rounded-2xl overflow-hidden transition-all duration-300 ${
                plan.highlight
                  ? "glass-violet violet-glow scale-[1.02] border border-violet/30"
                  : "glass border border-white/5"
              }`}
              data-delay={`${i * 100}`}
            >
              {plan.highlight && (
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-light to-transparent" />
              )}

              {plan.highlight && (
                <div className="absolute top-4 right-4">
                  <span className="glass-violet text-violet-light text-[10px] font-mono tracking-widest uppercase px-3 py-1 rounded-full border border-violet/30">
                    Empfohlen
                  </span>
                </div>
              )}

              <div className="p-8 flex flex-col flex-1">
                {/* Plan name & tagline */}
                <div className="mb-6">
                  <div
                    className="font-display font-bold text-chalk text-xl mb-1"
                    style={{ fontFamily: "'Clash Display', sans-serif" }}
                  >
                    {plan.name}
                  </div>
                  <div className="text-xs text-chalk-dim tracking-wide">{plan.tagline}</div>
                </div>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-end gap-1">
                    {plan.price === "0" ? (
                      <span
                        className="font-display font-bold text-4xl gradient-text"
                        style={{ fontFamily: "'Clash Display', sans-serif" }}
                      >
                        Gratis
                      </span>
                    ) : (
                      <>
                        <span
                          className="font-display font-bold text-4xl text-chalk"
                          style={{ fontFamily: "'Clash Display', sans-serif" }}
                        >
                          {plan.price}€
                        </span>
                        <span className="text-chalk-dim text-sm mb-1">{plan.priceLabel}</span>
                      </>
                    )}
                  </div>
                  {plan.credits !== null && (
                    <div className="mt-2 inline-flex items-center gap-1.5 glass px-3 py-1 rounded-full">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <circle cx="6" cy="6" r="5" stroke="#a855f7" strokeWidth="1.2"/>
                        <circle cx="6" cy="6" r="2" fill="#a855f7"/>
                      </svg>
                      <span className="text-xs text-chalk-dim">
                        <span className="text-violet-light font-semibold">{plan.credits}</span> Credits
                      </span>
                    </div>
                  )}
                  {plan.credits === null && (
                    <div className="mt-2 inline-flex items-center gap-1.5 glass px-3 py-1 rounded-full">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6h8M6 2l4 4-4 4" stroke="#a855f7" strokeWidth="1.3" strokeLinecap="round"/>
                      </svg>
                      <span className="text-xs text-violet-light font-semibold">Unbegrenzt</span>
                    </div>
                  )}
                </div>

                {/* Features */}
                <ul className="flex flex-col gap-3 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-chalk-dim">
                      <svg
                        className="mt-0.5 flex-shrink-0"
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                      >
                        <path d="M3 7l3 3 5-5" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  className={`w-full py-3 rounded-xl text-sm font-semibold magnetic-wrap ${
                    plan.highlight
                      ? "btn-primary violet-glow"
                      : "btn-ghost"
                  }`}
                >
                  <span>{plan.cta}</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Credit system explanation */}
        <div className="reveal mt-12 glass rounded-xl p-6 max-w-2xl mx-auto text-center" data-delay="100">
          <div className="text-xs font-mono tracking-widest uppercase text-violet mb-3" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            Wie Credits funktionieren
          </div>
          <p className="text-chalk-dim text-sm leading-relaxed">
            1 Credit = 1 verarbeitetes Video (beliebige Clip-Anzahl). Credits verfallen nicht.
            Zusatz-Credits ab <span className="text-violet-light">0,20€ pro Stück</span> im Shop.
          </p>
        </div>
      </div>
    </section>
  );
}
