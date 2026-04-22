import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
      colors: {
        brand: {
          50: "#f0fdf4",
          100: "#dcfce7",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
        },
      },
      keyframes: {
        pop: {
          "0%": { transform: "scale(0.8)", opacity: "0" },
          "60%": { transform: "scale(1.08)", opacity: "1" },
          "100%": { transform: "scale(1)" },
        },
        shake: {
          "0%,100%": { transform: "translateX(0)" },
          "20%,60%": { transform: "translateX(-6px)" },
          "40%,80%": { transform: "translateX(6px)" },
        },
        bob: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
        blink: {
          "0%,92%,100%": { transform: "scaleY(1)" },
          "95%": { transform: "scaleY(0.1)" },
        },
        bubble: {
          "0%": { transform: "scale(0.5) translateY(6px)", opacity: "0" },
          "70%": { transform: "scale(1.04)", opacity: "1" },
          "100%": { transform: "scale(1) translateY(0)" },
        },
        hit: {
          "0%": { transform: "scale(0.2) rotate(-25deg)", opacity: "0" },
          "25%": { transform: "scale(1.6) rotate(8deg)", opacity: "1" },
          "55%": { transform: "scale(1.25) rotate(-6deg)", opacity: "1" },
          "100%": { transform: "scale(1.1) rotate(12deg)", opacity: "0" },
        },
        mvJump: {
          "0%,100%": { transform: "translateY(0) scale(1,1)" },
          "20%": { transform: "translateY(6px) scale(1.2,0.7)" },
          "45%": { transform: "translateY(-70px) scale(0.85,1.25)" },
          "75%": { transform: "translateY(6px) scale(1.2,0.7)" },
          "90%": { transform: "translateY(-18px) scale(0.95,1.08)" },
        },
        mvSpin: {
          "0%": { transform: "rotate(0deg) scale(1)" },
          "50%": { transform: "rotate(540deg) scale(0.85)" },
          "100%": { transform: "rotate(1080deg) scale(1)" },
        },
        mvWiggle: {
          "0%,100%": { transform: "rotate(0deg)" },
          "15%": { transform: "rotate(-32deg)" },
          "45%": { transform: "rotate(32deg)" },
          "70%": { transform: "rotate(-24deg)" },
          "85%": { transform: "rotate(18deg)" },
        },
        mvNod: {
          "0%,100%": { transform: "rotate(0deg) translateY(0)" },
          "25%": { transform: "rotate(-22deg) translateY(-8px)" },
          "55%": { transform: "rotate(22deg) translateY(2px)" },
          "80%": { transform: "rotate(-12deg) translateY(-3px)" },
        },
        mvFlip: {
          "0%,100%": { transform: "scaleX(1) rotate(0deg)" },
          "25%": { transform: "scaleX(-1) rotate(0deg)" },
          "50%": { transform: "scaleX(-1) rotate(180deg)" },
          "75%": { transform: "scaleX(1) rotate(360deg)" },
        },
        mvSquish: {
          "0%,100%": { transform: "scale(1,1) translateY(0)" },
          "25%": { transform: "scale(1.6,0.45) translateY(18px)" },
          "55%": { transform: "scale(0.7,1.45) translateY(-22px)" },
          "80%": { transform: "scale(1.15,0.9) translateY(4px)" },
        },
        mvTiltL: {
          "0%,100%": { transform: "rotate(0deg) translateX(0)" },
          "45%": { transform: "rotate(-65deg) translateX(-18px)" },
          "80%": { transform: "rotate(25deg) translateX(10px)" },
        },
        mvTiltR: {
          "0%,100%": { transform: "rotate(0deg) translateX(0)" },
          "45%": { transform: "rotate(65deg) translateX(18px)" },
          "80%": { transform: "rotate(-25deg) translateX(-10px)" },
        },
        mvBoing: {
          "0%": { transform: "scale(0.3,0.3)" },
          "30%": { transform: "scale(1.7,1.7)" },
          "55%": { transform: "scale(0.8,0.8)" },
          "75%": { transform: "scale(1.25,1.25)" },
          "100%": { transform: "scale(1,1)" },
        },
        mvShimmy: {
          "0%,100%": { transform: "translate(0,0) rotate(0deg)" },
          "15%": { transform: "translate(-18px,-20px) rotate(-18deg)" },
          "35%": { transform: "translate(18px,-36px) rotate(18deg)" },
          "55%": { transform: "translate(-14px,-28px) rotate(-14deg)" },
          "75%": { transform: "translate(14px,-18px) rotate(14deg)" },
        },
      },
      animation: {
        pop: "pop 250ms ease-out",
        shake: "shake 300ms ease-in-out",
        bob: "bob 2.4s ease-in-out infinite",
        blink: "blink 4s ease-in-out infinite",
        bubble: "bubble 280ms ease-out",
        "mv-jump": "mvJump 900ms cubic-bezier(0.25,0.9,0.25,1.1)",
        "mv-spin": "mvSpin 900ms cubic-bezier(0.4,0,0.2,1)",
        "mv-wiggle": "mvWiggle 850ms ease-in-out",
        "mv-nod": "mvNod 900ms ease-in-out",
        "mv-flip": "mvFlip 900ms ease-in-out",
        "mv-squish": "mvSquish 800ms ease-out",
        "mv-tilt-l": "mvTiltL 750ms cubic-bezier(0.34,1.56,0.64,1)",
        "mv-tilt-r": "mvTiltR 750ms cubic-bezier(0.34,1.56,0.64,1)",
        "mv-boing": "mvBoing 850ms cubic-bezier(0.22,1.6,0.36,1)",
        "mv-shimmy": "mvShimmy 1100ms ease-in-out",
        hit: "hit 600ms ease-out forwards",
      },
    },
  },
  plugins: [],
};

export default config;
