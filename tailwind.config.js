/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#f7f8f4",
        foreground: "#2d4135",
        card: "#ffffff",
        border: "#dfe4da",
        muted: "#eef1ea",
        "muted-foreground": "#6b7f72",
        primary: "#476753",
        "primary-foreground": "#fdfdfc",
        secondary: "#e5ebe2",
        "secondary-foreground": "#4a6354",
        accent: "#d6e1d1",
        "accent-foreground": "#375243",
        destructive: "#c45942",
        "destructive-foreground": "#ffffff",
      },
      fontFamily: {
        sans: ["SourceSans3-Regular"],
        serif: ["NotoSerifSC-Regular"],
        "serif-medium": ["NotoSerifSC-Medium"],
        "sans-medium": ["SourceSans3-Medium"],
      },
      boxShadow: {
        card: "0px 4px 18px rgba(44, 65, 53, 0.08)",
        lift: "0px 16px 32px rgba(44, 65, 53, 0.12)",
      },
      borderRadius: {
        xl: "16px",
        "2xl": "20px",
        "3xl": "24px",
      },
    },
  },
  plugins: [],
};
