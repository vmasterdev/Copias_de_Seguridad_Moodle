import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f3f5ff',
          100: '#e7ebff',
          200: '#c6cbff',
          300: '#9da4ff',
          400: '#6f79ff',
          500: '#3d46ff',
          600: '#2a30db',
          700: '#2024aa',
          800: '#181b7a',
          900: '#11134f'
        }
      }
    }
  },
  plugins: []
};

export default config;
