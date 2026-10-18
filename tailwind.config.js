/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class", '[data-theme="dark"]'],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-urbanist)', 'Urbanist', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['var(--font-urbanist)', 'Urbanist', 'system-ui', 'sans-serif'],
        urbanist: ['var(--font-urbanist)', 'Urbanist', 'sans-serif'],
        heading: ['var(--font-urbanist)', 'Urbanist', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
