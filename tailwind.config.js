/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'velvet-night': '#162726',
        'pebble-linen': '#f8f4f0',
        'deep-harbor': '#2f4b4d',
        'chalk-linen': '#e5dbca',
        'midnight-alloy': '#1f3133',
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        },
      },
    },
  },
  plugins: [],
}
