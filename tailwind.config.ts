import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Japanese-inspired color palette
        sakura: {
          50: '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#ec4899',
          600: '#db2777',
        },
        // Torii gate red / vermillion
        vermillion: {
          50: '#fef2f2',
          100: '#ffe1e1',
          200: '#ffc9c9',
          300: '#ffa3a3',
          400: '#ff6b6b',
          500: '#e63946',
          600: '#c41e3a',
          700: '#a31530',
          800: '#87172b',
          900: '#731929',
        },
        // Indigo ink / sumi
        sumi: {
          50: '#f5f5f7',
          100: '#e4e4e9',
          200: '#c9c9d3',
          300: '#a8a8b9',
          400: '#83839a',
          500: '#656580',
          600: '#4f4f69',
          700: '#3d3d54',
          800: '#2a2a3d',
          900: '#1a1a2e',
          950: '#0f0f1a',
        },
        // Gold / kiniro
        kiniro: {
          50: '#fbf8eb',
          100: '#f6f0d3',
          200: '#ece0a8',
          300: '#e0ca72',
          400: '#d4af37',
          500: '#c49a2c',
          600: '#a67b24',
          700: '#865d20',
          800: '#6f4b22',
          900: '#5f4021',
        },
        // Matcha green
        matcha: {
          50: '#f4f9f4',
          100: '#e6f2e6',
          200: '#cee5cf',
          300: '#a7d0a9',
          400: '#78b37c',
          500: '#5a9a5e',
          600: '#457c49',
          700: '#39633c',
          800: '#315033',
          900: '#2a422c',
        },
        // Ocean blue / ai
        ai: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#baddfe',
          300: '#7cc3fc',
          400: '#36a5f8',
          500: '#0c88e9',
          600: '#006ac7',
          700: '#0054a1',
          800: '#054885',
          900: '#0a3d6e',
        },
      },
      fontFamily: {
        sans: ['var(--font-zen)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        },
      },
      backgroundImage: {
        'seigaiha': "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Cpath fill='%23ffffff' fill-opacity='0.03' d='M30 0c16.57 0 30 13.43 30 30S46.57 60 30 60 0 46.57 0 30 13.43 0 30 0zm0 4c-14.36 0-26 11.64-26 26s11.64 26 26 26 26-11.64 26-26S44.36 4 30 4zm0 4c12.15 0 22 9.85 22 22s-9.85 22-22 22S8 42.15 8 30 17.85 8 30 8zm0 4c-9.94 0-18 8.06-18 18s8.06 18 18 18 18-8.06 18-18-8.06-18-18-18z'/%3E%3C/svg%3E\")",
        'asanoha': "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Cpath fill='%23ffffff' fill-opacity='0.02' d='M20 0L40 20L20 40L0 20L20 0zM20 8L8 20L20 32L32 20L20 8z'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
};

export default config;
