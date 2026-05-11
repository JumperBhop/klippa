"use client";

export default function UpgradeModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div
        className="relative z-10 glass-strong rounded-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top glow line */}
        <div className="h-px bg-gradient-to-r from-transparent via-violet to-transparent" />

        <div className="p-8 text-center">
          {/* Icon */}
          <div className="w-16 h-16 glass-violet rounded-2xl flex items-center justify-center mx-auto mb-6 animate-[pulseGlow_2s_ease-in-out_infinite]">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M14 4l3 6 7 1-5 5 1.2 7L14 20l-6.2 3.2L9 16.2 4 11.2l7-1L14 4z" fill="#a855f7"/>
            </svg>
          </div>

          {/* Copy */}
          <h3
            className="font-display font-bold text-chalk text-2xl mb-2"
            style={{ fontFamily: "'Clash Display', sans-serif" }}
          >
            Credits aufgebraucht
          </h3>
          <p className="text-chalk-dim text-sm leading-relaxed mb-8">
            Deine 10 Gratis-Credits sind verbraucht. Upgrade auf Pro und erhalte
            <span className="text-violet-light font-semibold"> 49 Credits monatlich</span> sowie
            Zugang zu allen Premium-Features.
          </p>

          {/* Plans quick */}
          <div className="flex gap-3 mb-6">
            <div className="flex-1 glass rounded-xl p-4 text-center">
              <div className="text-chalk-dim text-xs mb-2">Pro</div>
              <div className="font-display font-bold text-chalk text-xl" style={{ fontFamily: "'Clash Display', sans-serif" }}>9€</div>
              <div className="text-chalk-dim text-xs">/Monat</div>
            </div>
            <div className="flex-1 glass-violet rounded-xl p-4 text-center border border-violet/30">
              <div className="text-violet-light text-xs mb-2">Unlimited</div>
              <div className="font-display font-bold text-chalk text-xl" style={{ fontFamily: "'Clash Display', sans-serif" }}>29€</div>
              <div className="text-chalk-dim text-xs">/Monat</div>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-col gap-2">
            <button className="btn-primary w-full py-3 rounded-xl violet-glow">
              <span>Jetzt upgraden</span>
            </button>
            <button onClick={onClose} className="btn-ghost w-full py-3 rounded-xl text-sm">
              Vielleicht später
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
