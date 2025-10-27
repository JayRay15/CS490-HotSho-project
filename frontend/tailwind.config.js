/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0C4A6E',   // deep blue
        accent: '#EAB308',    // gold/yellow
        success: '#16A34A',
        warning: '#F59E0B',
        error: '#EF4444',
        neutral: {
          50: '#FAFAFB',
          100: '#F5F7FB',
          200: '#E6EEF8',
          300: '#CBDCF0',
        },
      },
      fontFamily: {
        heading: ['Poppins', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem'
      },
      boxShadow: {
        mdsoft: '0 6px 18px rgba(12,74,110,0.06)'
      }
    },
  },
  plugins: [],
}
