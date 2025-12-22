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
        // ===== Brand v1.1 Palette (Terracotta) =====
        'sv-midnight': 'rgb(var(--color-sv-midnight) / <alpha-value>)',    // #0f2942 - Headers, headlines
        'sv-navy': 'rgb(var(--color-sv-navy) / <alpha-value>)',            // #1a3a5c - Secondary elements
        'sv-slate': 'rgb(var(--color-sv-slate) / <alpha-value>)',          // #3d5a80 - Body text
        'sv-terracotta': 'rgb(var(--color-sv-terracotta) / <alpha-value>)', // #D97757 - PRIMARY CTA
        'sv-ember': 'rgb(var(--color-sv-ember) / <alpha-value>)',          // #C4654A - Hover states
        'sv-peach': 'rgb(var(--color-sv-peach) / <alpha-value>)',          // #E8A090 - Light accents
        'sv-ivory': 'rgb(var(--color-sv-ivory) / <alpha-value>)',          // #fdfcf9 - Main backgrounds
        'sv-cream': 'rgb(var(--color-sv-cream) / <alpha-value>)',          // #f8f6f2 - Cards, modals
        'sv-bone': 'rgb(var(--color-sv-bone) / <alpha-value>)',            // #eeebe5 - Subtle backgrounds
        'sv-sand': 'rgb(var(--color-sv-sand) / <alpha-value>)',            // #e2ded6 - Borders ONLY
        'sv-stone': 'rgb(var(--color-sv-stone) / <alpha-value>)',          // #d4cfc5 - Muted text, disabled

        // ===== Legacy v1.0 Palette (deprecated, removing after migration) =====
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
        'border': 'rgb(var(--color-sv-sand) / <alpha-value>)',             // Updated to v1.1 sand
        'gunmetal': 'rgb(var(--color-valet-teal) / <alpha-value>)',        // → valet-teal
        'gunmetal-2': 'rgb(var(--color-oxford-navy) / <alpha-value>)',     // → oxford-navy
        'slate': 'rgb(var(--color-oxford-navy) / 0.6)',                    // → oxford-navy/60
        'cream': 'rgb(var(--color-soft-white) / <alpha-value>)',           // → soft-white
      },
    },
  },
  plugins: [],
}
