/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Storage Valet Brand Colors (TEAL Palette)
        'stormy-teal': '#006d77',       // Primary brand, headers, authority
        'tropical-teal': '#79b4b3',     // CTAs, primary accents, actions
        'tropical-teal-hover': '#6a9fa1', // Hover state for tropical-teal
        'oxford-navy': '#1d3557',       // Text, depth, dark elements
        'cerulean': '#457b9d',          // Hierarchy, borders, secondary elements
        'frosted-blue': '#a8dadc',      // Light accents, hover states
        'honeydew': '#f8f9fa',          // Page background
        'bright-snow': '#fafafa',       // Card surfaces, white areas
        'text-primary': '#1a1a1a',      // Dark text on light backgrounds
        'text-secondary': '#5a5a5a',    // Muted text, secondary content
        'border': '#e0e0e0',            // Borders, dividers

        // Legacy mappings (for any remaining old class names)
        'gunmetal': '#006d77',          // Maps to stormy-teal
        'gunmetal-2': '#1d3557',        // Maps to oxford-navy
        'slate': '#457b9d',             // Maps to cerulean
        'bone': '#a8dadc',              // Maps to frosted-blue
        'cream': '#f8f9fa',             // Maps to honeydew
      },
    },
  },
  plugins: [],
}
