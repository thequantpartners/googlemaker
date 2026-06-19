import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0B0E14",
        "neon-purple": "#A855F7",
        "neon-blue": "#3B82F6",
        "neon-green": "#10B981",
        "dark-card": "rgba(20, 24, 34, 0.6)",
        "dark-card-border": "rgba(255, 255, 255, 0.08)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      animation: {
        glow: "glow 2s ease-in-out infinite alternate",
        "fade-in-up": "fadeInUp 0.8s ease-out forwards",
      },
      keyframes: {
        glow: {
          "0%": { boxShadow: "0 0 10px rgba(168, 85, 247, 0.2)" },
          "100%": { boxShadow: "0 0 20px rgba(168, 85, 247, 0.6)" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
