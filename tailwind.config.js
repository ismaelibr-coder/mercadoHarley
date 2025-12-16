/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sick: {
          red: '#DC2626', // Red-600, vibrant red
          black: '#000000',
          white: '#FFFFFF',
          silver: '#C0C0C0',
        },
        // Alias for backward compatibility if needed, looking for harley-orange will get sick-red
        harley: {
          orange: '#DC2626',
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
