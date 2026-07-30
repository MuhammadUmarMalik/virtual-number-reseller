import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "rgb(226 232 240)",
        background: "rgb(248 250 252)",
        foreground: "rgb(15 23 42)"
      }
    }
  },
  plugins: []
};

export default config;
