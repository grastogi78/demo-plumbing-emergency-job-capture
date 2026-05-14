import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        phone: "0 24px 70px rgba(17, 24, 39, 0.2)",
        panel: "0 14px 35px rgba(17, 24, 39, 0.08)",
      },
    },
  },
  plugins: [],
} satisfies Config;
