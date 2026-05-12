import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./services/**/*.{ts,tsx}",
    "./store/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        zenvy: {
          ink: "#111D5A",
          rose: "#F22E8A",
          violet: "#5B2FCF",
          orange: "#FF9B36",
          cloud: "#FFF8F2",
          mist: "#F8ECFF",
          glow: "#FFE3B8",
        },
      },
      boxShadow: {
        glow: "0 22px 60px rgba(17, 29, 90, 0.14)",
        card: "0 16px 45px rgba(17, 29, 90, 0.10)",
      },
      backgroundImage: {
        "hero-radial":
          "radial-gradient(circle at top left, rgba(242,46,138,0.18), transparent 36%), radial-gradient(circle at top right, rgba(255,155,54,0.18), transparent 30%), linear-gradient(135deg, rgba(91,47,207,0.06), rgba(17,29,90,0.02))",
      },
      animation: {
        float: "float 8s ease-in-out infinite",
        drift: "drift 14s linear infinite",
        pulseSoft: "pulseSoft 4s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        drift: {
          "0%": { transform: "translateX(0px)" },
          "50%": { transform: "translateX(16px)" },
          "100%": { transform: "translateX(0px)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "0.85" },
          "50%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
