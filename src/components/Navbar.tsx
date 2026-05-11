"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { KlippaLogo } from "./KlippaLogo";

export default function Navbar({ variant = "landing" }: { variant?: "landing" | "app" }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Close menu on route change / link click */
  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled || menuOpen ? "glass border-b border-white/5 py-3" : "py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link href="/" className="magnetic-wrap" onClick={closeMenu}>
            <KlippaLogo />
          </Link>

          {variant === "landing" ? (
            <>
              {/* Desktop nav */}
              <div className="hidden md:flex items-center gap-8">
                <div className="flex items-center gap-6">
                  <a href="#features" className="nav-link">Features</a>
                  <a href="#pricing" className="nav-link">Preise</a>
                </div>
                <div className="flex items-center gap-3">
                  <Link href="/app" className="btn-ghost px-4 py-2 rounded-lg text-sm magnetic-wrap">
                    Anmelden
                  </Link>
                  <div className="magnetic-wrap">
                    <Link href="/app">
                      <button className="btn-primary px-5 py-2 rounded-lg text-sm">
                        <span>Kostenlos starten</span>
                      </button>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Mobile hamburger */}
              <button
                className="md:hidden w-10 h-10 flex flex-col items-center justify-center gap-1.5 rounded-lg glass"
                onClick={() => setMenuOpen((o) => !o)}
                aria-label="Menu öffnen"
              >
                <span
                  className={`block w-5 h-px bg-chalk transition-all duration-300 ${menuOpen ? "rotate-45 translate-y-[3px]" : ""}`}
                />
                <span
                  className={`block w-5 h-px bg-chalk transition-all duration-300 ${menuOpen ? "opacity-0" : ""}`}
                />
                <span
                  className={`block w-5 h-px bg-chalk transition-all duration-300 ${menuOpen ? "-rotate-45 -translate-y-[3px]" : ""}`}
                />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <CreditPill credits={10} />
              <button className="hidden sm:block btn-ghost px-4 py-2 rounded-lg text-sm">Profil</button>
            </div>
          )}
        </div>
      </nav>

      {/* Mobile menu dropdown */}
      {variant === "landing" && menuOpen && (
        <div className="fixed top-[60px] left-0 right-0 z-40 glass-strong border-b border-white/5 px-4 py-6 flex flex-col gap-4 md:hidden">
          <a href="#features" className="nav-link text-base py-2" onClick={closeMenu}>Features</a>
          <a href="#pricing" className="nav-link text-base py-2" onClick={closeMenu}>Preise</a>
          <div className="h-px bg-white/5 my-1" />
          <Link href="/app" onClick={closeMenu}>
            <button className="btn-ghost w-full py-3 rounded-xl text-sm">Anmelden</button>
          </Link>
          <Link href="/app" onClick={closeMenu}>
            <button className="btn-primary w-full py-3 rounded-xl text-sm">
              <span>Kostenlos starten</span>
            </button>
          </Link>
        </div>
      )}
    </>
  );
}

function CreditPill({ credits }: { credits: number }) {
  return (
    <div className="glass-violet flex items-center gap-2 px-3 py-2 rounded-full">
      <div className="w-2 h-2 rounded-full bg-violet-light" style={{ animation: "pulseGlow 2s ease-in-out infinite" }} />
      <span className="text-sm" style={{ fontFamily: "'JetBrains Mono', monospace", color: "#f5f5f5" }}>
        <span className="font-semibold" style={{ color: "#8b5cf6" }}>{credits}</span> Credits
      </span>
    </div>
  );
}
