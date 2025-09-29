/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#6C63FF', // bright indigo/purple
        'secondary': '#FF6584', // vivid coral
        'accent': '#00C49A',    // mint/teal
        'highlight': '#FFD93D', // vibrant yellow
        'light-bg': '#F9FAFB',  // soft gray-white
        'dark-bg': '#111827',   // deep, rich dark background
        'text-primary': '#111827',
        'text-secondary': '#374151',
        'text-muted': '#6B7280',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-in-out',
        'gradient-flow': 'gradient-flow 8s ease infinite',
        'scale-in': 'scaleIn 0.3s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        'gradient-flow': {
            '0%, 100%': { 'background-position': '0% 50%' },
            '50%': { 'background-position': '100% 50%' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: 0 },
          '100%': { transform: 'scale(1)', opacity: 1 },
        },
      },
    },
  },
  plugins: [],
}