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
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' }, // logo list is duplicated once, so -50% is exactly one full loop
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(220, 38, 38, 0.45)' },
          '50%': { boxShadow: '0 0 0 10px rgba(220, 38, 38, 0)' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.7s ease-out both',
        marquee: 'marquee 30s linear infinite',
        'pulse-glow': 'pulse-glow 2.5s ease-in-out infinite',
        // Referenced by FeaturedCarousel.jsx's decorative circle behind the
        // hero product photo but never actually defined — silently a no-op
        // until now.
        'spin-slow': 'spin 12s linear infinite',
      },
    },
  },
  plugins: [],
}
