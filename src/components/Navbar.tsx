"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { getUserInfo } from "@/lib/api";
import { KlippaLogo } from "./KlippaLogo";

export default function Navbar({ variant = "landing" }: { variant?: "landing" | "app" }) {
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 40);
      if (y < 80) {
        setVisible(true);
      } else if (y > lastY) {
        setVisible(false);
      } else {
        setVisible(true);
      }
      lastY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Close menu on route change / link click */
  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          visible && !menuOpen ? "opacity-100 translate-y-0" : !menuOpen ? "opacity-0 -translate-y-2 pointer-events-none" : "opacity-100 translate-y-0"
        } ${scrolled || menuOpen ? "glass border-b border-white/5 py-3" : "py-5"}`}
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
                  <Link href="/download" className="nav-link flex items-center gap-1.5">
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                      <path d="M6.5 1v8M4 7l2.5 2.5L9 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M1 10.5h11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                    </svg>
                    Downloader
                  </Link>
                </div>
                <AuthButtons />
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
              <LiveCreditPill />
              <Link href="/profile" className="hidden sm:block btn-ghost px-4 py-2 rounded-lg text-sm">Profil</Link>
            </div>
          )}
        </div>
      </nav>

      {/* Mobile menu dropdown */}
      {variant === "landing" && menuOpen && (
        <div className="fixed top-[60px] left-0 right-0 z-40 glass-strong border-b border-white/5 px-4 py-6 flex flex-col gap-4 md:hidden">
          <a href="#features" className="nav-link text-base py-2" onClick={closeMenu}>Features</a>
          <a href="#pricing" className="nav-link text-base py-2" onClick={closeMenu}>Preise</a>
          <Link href="/download" className="nav-link text-base py-2 flex items-center gap-2" onClick={closeMenu}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v9M4.5 8L7 10.5 9.5 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M1 11.5h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            Downloader
          </Link>
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

function AuthButtons() {
  const { isSignedIn } = useUser();
  if (isSignedIn === undefined) return null;
  if (isSignedIn) return (
    <div className="flex items-center gap-3">
      <LiveCreditPill />
      <UserMenu />
    </div>
  );
  return (
    <div className="flex items-center gap-3">
      <Link href="/sign-in" className="btn-ghost px-4 py-2 rounded-lg text-sm magnetic-wrap">
        Anmelden
      </Link>
      <div className="magnetic-wrap">
        <Link href="/sign-up">
          <button className="btn-primary px-5 py-2 rounded-lg text-sm">
            <span>Kostenlos starten</span>
          </button>
        </Link>
      </div>
    </div>
  );
}

function UserMenu() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [open, setOpen] = useState(false);

  if (!user) return null;
  const initials = (user.firstName?.[0] ?? user.emailAddresses[0]?.emailAddress[0] ?? "?").toUpperCase();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 glass px-3 py-2 rounded-xl border border-white/10 hover:border-violet/40 transition-all"
      >
        <div className="w-7 h-7 rounded-full bg-violet/30 border border-violet/50 flex items-center justify-center text-xs font-bold text-violet-light">
          {user.imageUrl ? (
            <img src={user.imageUrl} alt="" className="w-7 h-7 rounded-full object-cover" />
          ) : initials}
        </div>
        <span className="text-sm text-chalk hidden sm:block">{user.firstName ?? user.emailAddresses[0]?.emailAddress.split("@")[0]}</span>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="text-chalk-dim">
          <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 glass-strong border border-white/10 rounded-xl overflow-hidden z-50">
          <Link href="/app" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-4 py-3 text-sm text-chalk-dim hover:text-chalk hover:bg-white/5 transition-colors">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/><rect x="8" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/><rect x="1" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/><rect x="8" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/></svg>
            App
          </Link>
          <Link href="/profile" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-4 py-3 text-sm text-chalk-dim hover:text-chalk hover:bg-white/5 transition-colors">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="4.5" r="2.5" stroke="currentColor" strokeWidth="1.2"/><path d="M1.5 12c0-2.5 2.5-4 5.5-4s5.5 1.5 5.5 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
            Profil
          </Link>
          <div className="h-px bg-white/5" />
          <button
            onClick={() => signOut()}
            className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 2H2a1 1 0 00-1 1v8a1 1 0 001 1h3M9.5 9.5L13 7l-3.5-2.5M13 7H5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Abmelden
          </button>
        </div>
      )}
    </div>
  );
}

function LiveCreditPill() {
  const { user } = useUser();
  const [credits, setCredits] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    getUserInfo(user.id).then(info => setCredits(info.credits)).catch(() => {});
  }, [user]);

  return (
    <Link href="/profile">
      <div className="glass-violet flex items-center gap-2 px-3 py-2 rounded-full cursor-pointer hover:opacity-80 transition-opacity">
        <div className="w-2 h-2 rounded-full bg-violet-light" style={{ animation: "pulseGlow 2s ease-in-out infinite" }} />
        <span className="text-sm" style={{ fontFamily: "'JetBrains Mono', monospace", color: "#f5f5f5" }}>
          <span className="font-semibold" style={{ color: "#8b5cf6" }}>
            {credits === null ? "…" : credits}
          </span> Credits
        </span>
      </div>
    </Link>
  );
}
