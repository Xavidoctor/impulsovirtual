import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./content/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "#07090a",
        foreground: "#f2f4f3",
        muted: "#9aa5a2",
        border: "#1f272b",
        card: "#0f1315",
        accent: "#87d8c9",
        accentSoft: "#10201d"
      },
      fontFamily: {
        sans: ["Switzer", "sans-serif"],
        display: ["Clash Display", "Switzer", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
