import { KlippaLogo } from "@/components/KlippaLogo";

const links = {
  Produkt: ["Features", "Preise", "Changelog", "Roadmap"],
  Ressourcen: ["Dokumentation", "API", "Tutorials", "Status"],
  Rechtliches: ["Datenschutz", "AGB", "Impressum", "Cookies"],
};

export default function Footer() {
  return (
    <footer className="relative border-t border-white/5 pt-20 pb-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-16">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <KlippaLogo />
            <p className="text-chalk-dim text-sm leading-relaxed mt-4 max-w-xs">
              KI-gestütztes Video-Editing. Aus langen Videos werden virale Short-Clips —
              vollautomatisch.
            </p>
            <div className="flex items-center gap-3 mt-6">
              {["twitter", "instagram", "tiktok"].map((s) => (
                <a
                  key={s}
                  href="#"
                  className="w-9 h-9 glass rounded-lg flex items-center justify-center text-chalk-dim hover:text-chalk hover:border-violet/40 border border-transparent transition-all duration-200"
                >
                  <SocialIcon name={s} />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(links).map(([category, items]) => (
            <div key={category}>
              <div
                className="text-xs font-mono tracking-widest uppercase text-violet mb-5"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                {category}
              </div>
              <ul className="flex flex-col gap-3">
                {items.map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-sm text-chalk-dim hover:text-chalk transition-colors duration-200"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs text-muted">
            &copy; {new Date().getFullYear()} Klippa. Gebaut in Berlin.
          </span>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-xs text-chalk-dim font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              Alle Systeme normal
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function SocialIcon({ name }: { name: string }) {
  if (name === "twitter") return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
  if (name === "instagram") return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="2" width="20" height="20" rx="5"/>
      <circle cx="12" cy="12" r="4"/>
      <circle cx="17.5" cy="6.5" r="0.75" fill="currentColor" stroke="none"/>
    </svg>
  );
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.28 8.28 0 004.83 1.54V6.78a4.85 4.85 0 01-1.06-.09z"/>
    </svg>
  );
}
