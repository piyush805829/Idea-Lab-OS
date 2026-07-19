/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        campus: {
          bg: {
            light: '#FAFAFA',
            dark: '#09090B',
          },
          card: {
            light: '#FFFFFF',
            dark: '#18181B',
          },
          border: {
            light: '#E5E7EB',
            dark: '#27272A',
          },
          primary: {
            light: '#000000',
            dark: '#FFFFFF',
          },
          secondary: {
            light: '#6B7280',
            dark: '#A1A1AA',
          },
        }
      },
      boxShadow: {
        'soft-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.02)',
        'soft-md': '0 4px 6px -1px rgba(0, 0, 0, 0.03), 0 2px 4px -1px rgba(0, 0, 0, 0.02)',
        'soft-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.04), 0 4px 6px -2px rgba(0, 0, 0, 0.02)',
      },
      borderRadius: {
        'campus': '14px',
      }
    },
  },
  plugins: [],
}
