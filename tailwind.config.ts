import type { Config } from "tailwindcss";

// Dark HUD design tokens, PRD §5. Kept as Tailwind theme extensions rather than
// arbitrary values scattered through components so every screen pulls from the
// same palette instead of re-deciding it.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        hud: {
          bg: "#07090B",
          bg2: "#030507",
          panel: "rgba(16,21,26,0.75)",
          panelAlt: "#0a1116",
          line: "rgba(94,230,255,0.12)",
          text: "#EAF6F8",
          sub: "#9FB6BC",
          muted: "#6E8790",
          cyan: "#5EE6FF",
          amber: "#F0A94E",
          green: "#7FE0A0",
          violet: "#C79EF0",
          rose: "#F08FB0",
        },
      },
      fontFamily: {
        display: ["Michroma", "sans-serif"],
        body: ["Rajdhani", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
