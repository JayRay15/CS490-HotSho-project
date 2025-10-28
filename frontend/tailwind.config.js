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
      fontSize: {
        // Enhanced font size scale with line heights
        'xs': ['0.75rem', { lineHeight: '1.4' }],      // 12px - captions
        'sm': ['0.875rem', { lineHeight: '1.5' }],     // 14px - small text
        'base': ['1rem', { lineHeight: '1.6' }],       // 16px - body
        'lg': ['1.125rem', { lineHeight: '1.6' }],     // 18px - large body
        'xl': ['1.25rem', { lineHeight: '1.5' }],      // 20px - H3
        '2xl': ['1.5rem', { lineHeight: '1.4' }],      // 24px - H2
        '3xl': ['1.875rem', { lineHeight: '1.3' }],    // 30px - H1
        '4xl': ['2.25rem', { lineHeight: '1.2' }],     // 36px - Hero
        '5xl': ['3rem', { lineHeight: '1.1' }],        // 48px - Display
        '6xl': ['3.75rem', { lineHeight: '1' }],       // 60px - Large display
      },
      lineHeight: {
        'tight': '1.3',
        'snug': '1.4',
        'normal': '1.6',
        'relaxed': '1.7',
        'loose': '1.8',
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
