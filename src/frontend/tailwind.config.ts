import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './contexts/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        // Custom theme colors
        background: {
          DEFAULT: 'rgb(255, 255, 255)',
          dark: 'rgb(17, 24, 39)', // gray-900
        },
        foreground: {
          DEFAULT: 'rgb(17, 24, 39)', // gray-900
          dark: 'rgb(243, 244, 246)', // gray-100
        },
        muted: {
          DEFAULT: 'rgb(249, 250, 251)', // gray-50
          dark: 'rgb(31, 41, 55)', // gray-800
          foreground: {
            DEFAULT: 'rgb(107, 114, 128)', // gray-500
            dark: 'rgb(156, 163, 175)', // gray-400
          },
        },
        border: {
          DEFAULT: 'rgb(229, 231, 235)', // gray-200
          dark: 'rgb(75, 85, 99)', // gray-600
        },
        card: {
          DEFAULT: 'rgb(255, 255, 255)',
          dark: 'rgb(31, 41, 55)', // gray-800
        },
        // Status colors for booking system
        status: {
          pending: {
            DEFAULT: 'rgb(245, 158, 11)', // amber-500
            dark: 'rgb(251, 191, 36)', // amber-400
          },
          accepted: {
            DEFAULT: 'rgb(16, 185, 129)', // emerald-500
            dark: 'rgb(52, 211, 153)', // emerald-400
          },
          rejected: {
            DEFAULT: 'rgb(239, 68, 68)', // red-500
            dark: 'rgb(248, 113, 113)', // red-400
          },
          completed: {
            DEFAULT: 'rgb(99, 102, 241)', // indigo-500
            dark: 'rgb(129, 140, 248)', // indigo-400
          },
        },
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'zoom-in': {
          '0%': { transform: 'scale(0.95)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'zoom-in': 'zoom-in 0.2s ease-out',
        'fade-in-0': 'fade-in 0.15s ease-out',
        'zoom-in-95': 'zoom-in 0.15s ease-out',
      },
    },
  },
  plugins: [],
};

export default config;