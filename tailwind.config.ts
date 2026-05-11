import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        void: "#0a0a0a",
        "void-2": "#111111",
        "void-3": "#1a1a1a",
        violet: {
          DEFAULT: "#7c3aed",
          light: "#8b5cf6",
          dark: "#6d28d9",
          glow: "#a855f7",
        },
        chalk: "#f5f5f5",
        muted: "#666666",
      },
      fontFamily: {
        display: ["'Clash Display'", "sans-serif"],
        body: ["'Syne'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      animation: {
        "gradient-shift": "gradientShift 8s ease infinite",
        "mesh-float": "meshFloat 12s ease-in-out infinite",
        "mesh-float-2": "meshFloat2 15s ease-in-out infinite",
        "mesh-float-3": "meshFloat3 10s ease-in-out infinite",
        glitch: "glitch 3s infinite",
        "glitch-2": "glitch2 3s infinite",
        "cursor-glow": "cursorGlow 0.1s linear",
        typewriter: "typewriter 2.5s steps(40) forwards",
        blink: "blink 1s step-end infinite",
        "fade-up": "fadeUp 0.6s ease forwards",
        "fade-in": "fadeIn 0.8s ease forwards",
        "scale-in": "scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        "slide-in-left": "slideInLeft 0.6s ease forwards",
        float: "float 6s ease-in-out infinite",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
        "rotate-slow": "rotateSlow 20s linear infinite",
        "scan-line": "scanLine 3s linear infinite",
        "progress-fill": "progressFill 2s ease forwards",
      },
      keyframes: {
        gradientShift: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        meshFloat: {
          "0%, 100%": { transform: "translate(0px, 0px) scale(1)" },
          "33%": { transform: "translate(30px, -50px) scale(1.1)" },
          "66%": { transform: "translate(-20px, 20px) scale(0.9)" },
        },
        meshFloat2: {
          "0%, 100%": { transform: "translate(0px, 0px) scale(1.1)" },
          "33%": { transform: "translate(-40px, 30px) scale(0.95)" },
          "66%": { transform: "translate(25px, -35px) scale(1.05)" },
        },
        meshFloat3: {
          "0%, 100%": { transform: "translate(0px, 0px) scale(1)" },
          "50%": { transform: "translate(20px, 40px) scale(1.15)" },
        },
        glitch: {
          "0%, 90%, 100%": { clipPath: "inset(0 0 100% 0)", transform: "translate(0)" },
          "92%": { clipPath: "inset(10% 0 60% 0)", transform: "translate(-4px, 2px)", filter: "hue-rotate(90deg)" },
          "94%": { clipPath: "inset(50% 0 20% 0)", transform: "translate(4px, -2px)", filter: "hue-rotate(180deg)" },
          "96%": { clipPath: "inset(30% 0 40% 0)", transform: "translate(-2px, 1px)" },
          "98%": { clipPath: "inset(70% 0 5% 0)", transform: "translate(2px, -1px)" },
        },
        glitch2: {
          "0%, 90%, 100%": { clipPath: "inset(100% 0 0 0)", transform: "translate(0)" },
          "92%": { clipPath: "inset(60% 0 10% 0)", transform: "translate(4px, -2px)", filter: "hue-rotate(-90deg)" },
          "94%": { clipPath: "inset(20% 0 50% 0)", transform: "translate(-4px, 2px)" },
          "96%": { clipPath: "inset(40% 0 30% 0)", transform: "translate(2px, -1px)" },
          "98%": { clipPath: "inset(5% 0 70% 0)", transform: "translate(-2px, 1px)" },
        },
        cursorGlow: {
          from: { transform: "scale(1)" },
          to: { transform: "scale(1.2)" },
        },
        typewriter: {
          from: { width: "0" },
          to: { width: "100%" },
        },
        blink: {
          "0%, 100%": { borderColor: "transparent" },
          "50%": { borderColor: "#7c3aed" },
        },
        fadeUp: {
          from: { opacity: "0", transform: "translateY(30px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        scaleIn: {
          from: { opacity: "0", transform: "scale(0.8)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        slideInLeft: {
          from: { opacity: "0", transform: "translateX(-40px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(124, 58, 237, 0.4)" },
          "50%": { boxShadow: "0 0 60px rgba(124, 58, 237, 0.8), 0 0 120px rgba(124, 58, 237, 0.3)" },
        },
        rotateSlow: {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        scanLine: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        progressFill: {
          from: { width: "0%" },
          to: { width: "var(--progress-width)" },
        },
      },
      backgroundSize: {
        "300%": "300%",
      },
    },
  },
  plugins: [],
};

export default config;
