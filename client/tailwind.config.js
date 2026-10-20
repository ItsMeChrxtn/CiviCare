/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Driven by CSS variables (see index.css) so opacity modifiers work on the CiviCare green.
        primary: Object.fromEntries(
          [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((shade) => [
            shade,
            `rgb(var(--primary-${shade}) / <alpha-value>)`,
          ])
        ),
        brand: {
          green: '#0b7a3e',
          greenDark: '#085c2e',
          sand: '#efede4',
          orange: '#f28c1b',
        },
        accent: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Lexend', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 4px 24px -4px rgba(0,0,0,0.08)',
        card: '0 1px 2px 0 rgba(15,23,42,0.04), 0 8px 24px -8px rgba(15,23,42,0.10)',
        'card-hover': '0 1px 2px 0 rgba(15,23,42,0.04), 0 16px 36px -10px rgba(15,23,42,0.16)',
        glass: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
        glow: '0 0 0 1px rgb(var(--primary-500) / 0.15), 0 8px 24px -4px rgb(var(--primary-500) / 0.35)',
      },
      backdropBlur: {
        xs: '2px',
      },
      backgroundImage: {
        'grid-slate': 'linear-gradient(to right, rgba(148,163,184,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.08) 1px, transparent 1px)',
        'radial-fade': 'radial-gradient(circle at top, rgb(var(--primary-500) / 0.14), transparent 60%)',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(12px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        scaleIn: { from: { opacity: 0, transform: 'scale(0.96)' }, to: { opacity: 1, transform: 'scale(1)' } },
        float: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
      animation: {
        fadeIn: 'fadeIn 0.5s ease-out both',
        slideUp: 'slideUp 0.5s cubic-bezier(0.16,1,0.3,1) both',
        scaleIn: 'scaleIn 0.3s cubic-bezier(0.16,1,0.3,1) both',
        float: 'float 6s ease-in-out infinite',
        shimmer: 'shimmer 2.5s linear infinite',
      },
    },
  },
  plugins: [],
};
