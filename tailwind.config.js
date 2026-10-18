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
        sans: ['var(--font-fredoka)', 'Fredoka', 'system-ui', 'sans-serif'],
        serif: ['var(--font-lilita)', 'Lilita One', 'var(--font-fredoka)', 'system-ui', 'sans-serif'],
        urbanist: ['var(--font-fredoka)', 'Fredoka', 'sans-serif'],
        heading: ['var(--font-lilita)', 'Lilita One', 'sans-serif'],
        brick: ['var(--font-lilita)', 'Lilita One', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
