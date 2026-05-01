import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#2563eb",
          600: "#1d4ed8",
          700: "#1e40af",
          800: "#1e3a8a",
          900: "#172554"
        },
        ink: "#0f172a",
        mist: "#e2e8f0",
        cloud: "#f8fafc",
        sand: "#f8f5ef",
        emerald: "#047857",
        amber: "#b45309",
        rose: "#b91c1c"
      },
      fontFamily: {
        sans: ["'Inter'", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "SFMono-Regular", "monospace"]
      },
      boxShadow: {
        soft: "0 20px 60px rgba(15, 23, 42, 0.08)",
        panel: "0 12px 36px rgba(15, 23, 42, 0.10)"
      },
      backgroundImage: {
        "hero-grid":
          "radial-gradient(circle at top left, rgba(37,99,235,0.14), transparent 36%), radial-gradient(circle at 85% 20%, rgba(4,120,87,0.12), transparent 28%), linear-gradient(135deg, rgba(255,255,255,0.98), rgba(248,250,252,0.96))"
      }
    }
  },
  plugins: []
} satisfies Config;
