import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#101524",
        ocean: {
          DEFAULT: "#0f7ad8",
          light: "#3d9be5",
          dark: "#0b65b3",
        },
        mint: "#20c997",
        warning: "#f59f00",
        surface: "#f8fbff",
        "surface-dark": "#111827",
      },
      backgroundImage: {
        "dotix-gradient": "radial-gradient(circle at top left, #ddf4ff 0%, #f7fbff 45%, #ffffff 100%)",
        "dotix-gradient-dark": "radial-gradient(circle at top left, #172036 0%, #0b1220 45%, #060b14 100%)",
        "brand-gradient": "linear-gradient(135deg, #0f7ad8 0%, #20c997 100%)",
      },
      fontFamily: {
        sans: ["'DM Sans'", "sans-serif"],
        display: ["'Space Grotesk'", "'DM Sans'", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
