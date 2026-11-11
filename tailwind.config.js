/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background, #000000)",
        foreground: "var(--foreground, #ffffff)",
        card: {
          DEFAULT: "var(--card, #0a0a0a)",
          foreground: "var(--card-foreground, #ffffff)",
        },
        popover: {
          DEFAULT: "var(--popover, #0a0a0a)",
          foreground: "var(--popover-foreground, #ffffff)",
        },
        primary: {
          DEFAULT: "var(--primary, #ffffff)",
          foreground: "var(--primary-foreground, #000000)",
        },
        secondary: {
          DEFAULT: "var(--secondary, #171717)",
          foreground: "var(--secondary-foreground, #ffffff)",
        },
        muted: {
          DEFAULT: "var(--muted, #1a1a1a)",
          foreground: "var(--muted-foreground, #a3a3a3)",
        },
        accent: {
          DEFAULT: "var(--accent, #262626)",
          foreground: "var(--accent-foreground, #ffffff)",
        },
        destructive: {
          DEFAULT: "var(--destructive, #ef4444)",
          foreground: "var(--destructive-foreground, #ffffff)",
        },
        border: "var(--border, #262626)",
        input: "var(--input, #262626)",
        ring: "var(--ring, #ffffff)",
      },
      borderRadius: {
        lg: "var(--radius, 12px)",
        md: "calc(var(--radius, 12px) - 2px)",
        sm: "calc(var(--radius, 12px) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-in-out",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
}

