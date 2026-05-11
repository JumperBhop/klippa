export function KlippaLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: { icon: 28, text: "text-lg" },
    md: { icon: 34, text: "text-xl" },
    lg: { icon: 48, text: "text-3xl" },
  };
  const { icon, text } = sizes[size];

  return (
    <div className="flex items-center gap-2.5">
      {/* Stilisiertes K wie ein Schnitt */}
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 34 34"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="34" height="34" rx="8" fill="#7c3aed" />
        {/* Vertikale Linie des K */}
        <rect x="9" y="7" width="3.5" height="20" rx="1" fill="white" />
        {/* Oberer Schrägstrich — scharf wie ein Schnitt */}
        <path
          d="M13 17 L24 8"
          stroke="white"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        {/* Unterer Schrägstrich */}
        <path
          d="M13 17 L25 26"
          stroke="white"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        {/* Akzent-Punkt */}
        <circle cx="26" cy="17" r="2" fill="#a855f7" />
      </svg>
      <span
        className={`${text} font-display font-bold tracking-tight`}
        style={{ fontFamily: "'Clash Display', sans-serif" }}
      >
        <span className="text-chalk">Klip</span>
        <span className="gradient-text">pa</span>
      </span>
    </div>
  );
}
