/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'serif': ['"DM Serif Display"', 'Georgia', 'serif'],
        'sans': ['Inter', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Storage Valet Brand Palette v1.1 (6 colors)
        // Uses CSS variables for alpha support: bg-oxford-navy/50, text-valet-teal/80, etc.
        'oxford-navy': 'rgb(var(--color-oxford-navy) / <alpha-value>)',    // #1d3557 - Text, depth, authority
        'valet-teal': 'rgb(var(--color-valet-teal) / <alpha-value>)',      // #006d77 - Primary CTA, links
        'bright-snow': 'rgb(var(--color-bright-snow) / <alpha-value>)',    // #d5dede - Marketing backgrounds
        'soft-white': 'rgb(var(--color-soft-white) / <alpha-value>)',      // #fafafa - App backgrounds, cards
        'bone': 'rgb(var(--color-bone) / <alpha-value>)',                  // #e8e4e0 - Warm neutral, badges
        'burnished-gold': 'rgb(var(--color-burnished-gold) / <alpha-value>)', // #c9a962 - Premium accents

        // Legacy mappings (backward compatibility during transition)
        'stormy-teal': 'rgb(var(--color-valet-teal) / <alpha-value>)',     // → valet-teal
        'tropical-teal': 'rgb(var(--color-valet-teal) / <alpha-value>)',   // → valet-teal
        'tropical-teal-hover': 'rgb(var(--color-valet-teal) / 0.9)',       // → valet-teal/90
        'cerulean': 'rgb(var(--color-oxford-navy) / 0.6)',                 // → oxford-navy/60
        'frosted-blue': 'rgb(var(--color-bone) / <alpha-value>)',          // → bone
        'honeydew': 'rgb(var(--color-soft-white) / <alpha-value>)',        // → soft-white
        'text-primary': 'rgb(var(--color-oxford-navy) / <alpha-value>)',   // → oxford-navy
        'text-secondary': 'rgb(var(--color-oxford-navy) / 0.6)',           // → oxford-navy/60
        'border': 'rgb(var(--color-oxford-navy) / 0.12)',                  // → oxford-navy/12
        'gunmetal': 'rgb(var(--color-valet-teal) / <alpha-value>)',        // → valet-teal
        'gunmetal-2': 'rgb(var(--color-oxford-navy) / <alpha-value>)',     // → oxford-navy
        'slate': 'rgb(var(--color-oxford-navy) / 0.6)',                    // → oxford-navy/60
        'cream': 'rgb(var(--color-soft-white) / <alpha-value>)',           // → soft-white
      },
    },
  },
  plugins: [],
}
