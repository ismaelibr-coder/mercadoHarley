/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        harley: {
          orange: '#FF6600',
          black: '#000000',
          white: '#FFFFFF',
          silver: '#C0C0C0',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Oswald', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
