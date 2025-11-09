/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Storage Valet Brand Colors (ONYX Palette)
        'gunmetal': '#162726',        // Dark forest green - primary dark
        'gunmetal-2': '#1f3133',      // Medium forest green - secondary dark
        'slate': '#2f4b4d',           // Dark slate gray - accents
        'bone': '#e5dbca',            // Warm cream - highlights, cards
        'cream': '#f8f4f0',           // Light cream - backgrounds, body

        // Legacy aliases (for backward compatibility)
        'velvet-night': '#162726',
        'pebble-linen': '#f8f4f0',
        'deep-harbor': '#2f4b4d',
        'chalk-linen': '#e5dbca',
        'midnight-alloy': '#1f3133',
      },
    },
  },
  plugins: [],
}
