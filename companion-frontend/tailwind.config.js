/** @type {import('tailwindcss').Config} */
const withAlpha = (v) => `rgb(var(${v}) / <alpha-value>)`;

module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Driven by CSS variables in globals.css (single source of truth)
        bg: withAlpha('--bg'),
        ink: withAlpha('--ink'),
        'ink-soft': withAlpha('--ink-soft'),
        surface: withAlpha('--surface'),
        'surface-2': withAlpha('--surface-2'),
        border: withAlpha('--border'),
        primary: {
          DEFAULT: withAlpha('--primary'),
          bright: withAlpha('--primary-bright'),
          deep: withAlpha('--primary-deep'),
        },
        success: withAlpha('--success'),
        danger: withAlpha('--danger'),
        fire: withAlpha('--fire'),
        gold: withAlpha('--gold'),
        headline: withAlpha('--headline'),
        paragraph: withAlpha('--paragraph'),
        muted: withAlpha('--muted'),
      },
      fontFamily: {
        display: ['var(--font-black-ops)', 'system-ui', 'sans-serif'],
        heading: ['var(--font-russo)', 'system-ui', 'sans-serif'],
        body: ['var(--font-chakra)', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        // Warm signature gradient: orange → coral → pink (no violet)
        'fire-gradient': 'linear-gradient(120deg, #ff8906 0%, #f25f4c 50%, #e53170 100%)',
        'ember-gradient': 'linear-gradient(120deg, #ff8906 0%, #f25f4c 100%)',
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(255,137,6,0.22), 0 12px 40px -10px rgba(255,137,6,0.40)',
        'glow-fire': '0 0 0 1px rgba(242,95,76,0.22), 0 12px 40px -10px rgba(242,95,76,0.45)',
        'glow-success': '0 0 0 1px rgba(44,182,125,0.22), 0 12px 40px -10px rgba(44,182,125,0.38)',
      },
      borderRadius: {
        xl2: '20px',
        xl3: '24px',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 16px rgba(255,137,6,0.25)' },
          '50%': { boxShadow: '0 0 30px rgba(255,137,6,0.6)' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
      animation: {
        'pulse-glow': 'pulse-glow 2.2s ease-in-out infinite',
        'fade-up': 'fade-up 600ms cubic-bezier(0.22,1,0.36,1) both',
        'fade-in': 'fade-in 400ms ease-out both',
        float: 'float 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
