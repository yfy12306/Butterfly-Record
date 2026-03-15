import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#102030",
        moss: "#4A6B3F",
        leaf: "#7D9B62",
        cream: "#F6F3EA",
        sand: "#DCC9A3",
        ember: "#A85A3A"
      },
      boxShadow: {
        panel: "0 18px 50px rgba(16, 32, 48, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
