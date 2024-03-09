import type { Config } from "tailwindcss";

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      boxShadow: {
        purple: "0 35px 75px -15px rgba(90,0,170,0.475)",
        skyblue: "0 35px 75px -15px rgba(0, 170, 255, 0.475)",
        osu: "0 35px 75px -45px rgba(255, 102, 0, 0.175)",
        osubrown: "0 35px 35px -15px rgba(102, 51, 0, 0.475)",
        osublack: "0 35px 75px -15px rgba(0, 0, 0, 0.475)",
        osuw: "0 35px 75px -55px rgba(255, 255, 255, 0.475)",
      },
      colors: {
        osu: "rgba(255, 102, 0, 1)",
        osubrown: "rgba(202, 61, 0, 1)",
        python: "rgba(75, 135, 185, 1)",
        javascript: "rgba(241, 212, 86, 1)",
        java: "rgba(176, 114, 25, 1)",
        c: "rgba(72, 118, 255, 1)",
        "c++": "rgba(51, 102, 153, 1)",
        "c#": "rgba(100, 100, 100, 1)",
        go: "rgba(0, 102, 153, 1)",
        kotlin: "rgba(230, 0, 0, 1)",
        ruby: "rgba(204, 0, 0, 1)",
        rust: "rgba(153, 102, 51, 1)",
        swift: "rgba(255, 153, 0, 1)",
        typescript: "rgba(43, 116, 180, 1)",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "text-focus-in":
          "text-focus-in 1s cubic-bezier(0.550, 0.085, 0.680, 0.530) both",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "text-focus-in": {
          "0%": {
            filter: "blur(12px)",
            opacity: "0",
          },
          to: {
            filter: "blur(0)",
            opacity: "1",
          },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

export default config;
