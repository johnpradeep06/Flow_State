/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: '#0f0f13',
        surface: '#1c1c21',
        primary: '#6366f1',
        ambiguity: {
          vague: '#D85A30',
          metric: '#BA7517',
          ref: '#7F77DD',
          assume: '#378ADD',
          scope: '#639922'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
