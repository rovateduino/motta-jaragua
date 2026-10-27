import type { Config } from "tailwindcss";

const config = {
  content: [
    "./src/**/*.{ts,tsx,mdx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        motta: {
          red: "#D71920",
          "red-dark": "#B91319",
          yellow: "#FFDF33",
          ink: "#181818",
          black: "#000000",
          white: "#FFFFFF",
          "gray-50": "#F7F7F8",
          "gray-100": "#F5F5F5",
          "gray-200": "#E7E7EA",
          "gray-300": "#D4D4D8",
          "gray-500": "#6B7280",
          "gray-700": "#3F3F46",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgba(24, 24, 24, 0.06), 0 4px 16px rgba(24, 24, 24, 0.04)",
      },
      fontFamily: {
        sans: [
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.4s ease-out both",
      },
    },
  },
  plugins: [],
} satisfies Config;

export default config;
