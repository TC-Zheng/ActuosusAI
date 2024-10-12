import type { Config } from "tailwindcss";
import colors from "tailwindcss/colors";

const config: {
  plugins: unknown[];
  theme: { extend: { colors: {primary: unknown, secondary: unknown, background: unknown, error: unknown, accent: unknown} } };
  content: string[]
} = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // example
        // text-primary-500, bg-background-900, text-error-500, border-primary-500
        primary: colors.slate,
        secondary: colors.sky,
        background: colors.neutral,
        error: colors.red,
        accent: colors.amber,
      },
    },
  },
  plugins: [],
};
export default config;
