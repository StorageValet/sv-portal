/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'check-bounce': {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.2)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      animation: {
        'scale-in': 'scale-in 0.2s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'check-bounce': 'check-bounce 0.2s ease-out',
      },
      fontFamily: {
        'serif': ['"DM Serif Display"', 'Georgia', 'serif'],
        'sans': ['Inter', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        // ===== Brand v1.1 Palette (Terracotta) =====
        'sv-midnight': 'rgb(var(--color-sv-midnight) / <alpha-value>)',    // #0f2942 - Headers, headlines
        'sv-navy': 'rgb(var(--color-sv-navy) / <alpha-value>)',            // #1a3a5c - Secondary elements
        'sv-slate': 'rgb(var(--color-sv-slate) / <alpha-value>)',          // #3d5a80 - Body text
        'sv-viridian': 'rgb(var(--color-sv-viridian) / <alpha-value>)',    // #2C4A52 - Hero panels (matches landing)
        'sv-terracotta': 'rgb(var(--color-sv-terracotta) / <alpha-value>)', // #D97757 - PRIMARY CTA
        'sv-ember': 'rgb(var(--color-sv-ember) / <alpha-value>)',          // #C4654A - Hover states
        'sv-peach': 'rgb(var(--color-sv-peach) / <alpha-value>)',          // #E8A090 - Light accents
        'sv-ivory': 'rgb(var(--color-sv-ivory) / <alpha-value>)',          // #fdfcf9 - Main backgrounds
        'sv-cream': 'rgb(var(--color-sv-cream) / <alpha-value>)',          // #f8f6f2 - Cards, modals
        'sv-bone': 'rgb(var(--color-sv-bone) / <alpha-value>)',            // #eeebe5 - Subtle backgrounds
        'sv-sand': 'rgb(var(--color-sv-sand) / <alpha-value>)',            // #e2ded6 - Borders ONLY
        'sv-stone': 'rgb(var(--color-sv-stone) / <alpha-value>)',          // #d4cfc5 - Muted text, disabled

        // ===== Brand v2.2 Palette (January 2026) =====
        'sv-deep-teal': 'rgb(var(--color-sv-deep-teal) / <alpha-value>)',   // #213C47 - Headers, hero panels
        'sv-gunmetal': 'rgb(var(--color-sv-gunmetal) / <alpha-value>)',     // #343A40 - Primary body text
        'sv-steel': 'rgb(var(--color-sv-steel) / <alpha-value>)',           // #88989A - Muted, placeholders
        'sv-brown': 'rgb(var(--color-sv-brown) / <alpha-value>)',           // #6B4E3D - PRIMARY CTA
        'sv-brown-hover': 'rgb(var(--color-sv-brown-hover) / <alpha-value>)', // #5A4133 - CTA hover
        'sv-accent': 'rgb(var(--color-sv-accent) / <alpha-value>)',         // #0E6F6A - Links, focus rings
        'sv-parchment': 'rgb(var(--color-sv-parchment) / <alpha-value>)',   // #EEEBE5 - Warm backgrounds
        'sv-alabaster': 'rgb(var(--color-sv-alabaster) / <alpha-value>)',   // #E0E1DD - Cool backgrounds
        'sv-white': 'rgb(var(--color-sv-white) / <alpha-value>)',           // #FFFFFF - Cards, modals

        // ===== DEPRECATED: Legacy v1.0 Teal Palette =====
        // DO NOT USE in new code. Use sv-* tokens above instead.
        // Kept only for backward compatibility during Brand v1.1 transition.
        // Maps teal-based aliases to Brand v1.1 equivalents.
        'oxford-navy': 'rgb(var(--color-sv-navy) / <alpha-value>)',        // DEPRECATED → use sv-navy
        'valet-teal': 'rgb(var(--color-sv-terracotta) / <alpha-value>)',   // DEPRECATED → use sv-terracotta (CTA)
        'bright-snow': 'rgb(var(--color-sv-bone) / <alpha-value>)',        // DEPRECATED → use sv-bone
        'soft-white': 'rgb(var(--color-sv-ivory) / <alpha-value>)',        // DEPRECATED → use sv-ivory
        'bone': 'rgb(var(--color-sv-bone) / <alpha-value>)',               // DEPRECATED → use sv-bone
        'burnished-gold': 'rgb(var(--color-sv-peach) / <alpha-value>)',    // DEPRECATED → use sv-peach

        // DEPRECATED legacy aliases (all map to Brand v1.1 tokens)
        'stormy-teal': 'rgb(var(--color-sv-terracotta) / <alpha-value>)',  // DEPRECATED → sv-terracotta
        'tropical-teal': 'rgb(var(--color-sv-terracotta) / <alpha-value>)',// DEPRECATED → sv-terracotta
        'tropical-teal-hover': 'rgb(var(--color-sv-ember) / <alpha-value>)',// DEPRECATED → sv-ember
        'cerulean': 'rgb(var(--color-sv-slate) / <alpha-value>)',          // DEPRECATED → sv-slate
        'frosted-blue': 'rgb(var(--color-sv-bone) / <alpha-value>)',       // DEPRECATED → sv-bone
        'honeydew': 'rgb(var(--color-sv-ivory) / <alpha-value>)',          // DEPRECATED → sv-ivory
        'text-primary': 'rgb(var(--color-sv-midnight) / <alpha-value>)',   // DEPRECATED → sv-midnight
        'text-secondary': 'rgb(var(--color-sv-slate) / <alpha-value>)',    // DEPRECATED → sv-slate
        'border': 'rgb(var(--color-sv-sand) / <alpha-value>)',             // DEPRECATED → sv-sand
        'gunmetal': 'rgb(var(--color-sv-midnight) / <alpha-value>)',       // DEPRECATED → sv-midnight
        'gunmetal-2': 'rgb(var(--color-sv-navy) / <alpha-value>)',         // DEPRECATED → sv-navy
        'slate': 'rgb(var(--color-sv-slate) / <alpha-value>)',             // DEPRECATED → sv-slate
        'cream': 'rgb(var(--color-sv-cream) / <alpha-value>)',             // DEPRECATED → sv-cream
      },
    },
  },
  plugins: [],
}
