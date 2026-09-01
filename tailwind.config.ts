import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#1b4332', dark: '#0f2921', light: '#2d6a4f' },
        accent: { DEFAULT: '#d4a373', light: '#e9c46a', dark: '#b9895a' },
        cream: '#f4f1ea',
        carbon: '#212529'
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        display: ['var(--font-poppins)', 'sans-serif']
      }
    }
  },
  plugins: []
};

export default config;
