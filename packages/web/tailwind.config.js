/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{svelte,js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        'mono': ['Consolas', 'Monaco', 'monospace'],
      },
      maxWidth: {
        'container': '1000px',
      }
    },
  },
  plugins: [],
}


