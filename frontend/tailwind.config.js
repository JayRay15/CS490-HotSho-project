/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary palette - Sage greens (main brand colors)
        primary: {
          50: '#F5F6F4',    // Lightest sage - backgrounds
          100: '#E8EAE5',   // Very light sage
          200: '#D4D7CC',   // Light sage
          300: '#CBCBCB',   // Your color #3 - borders, dividers
          400: '#B7B89F',   // Your color #2 - secondary elements
          500: '#777C6D',   // Your color #1 - main primary color
          600: '#656A5C',   // Darker sage
          700: '#4F5348',   // Dark sage
          800: '#3A3D35',   // Very dark sage
          900: '#252722',   // Darkest sage
          DEFAULT: '#777C6D', // Default primary
        },
        
        // Secondary palette - Neutral grays (supporting colors)
        secondary: {
          50: '#FAFAFA',    // Almost white
          100: '#F5F5F5',   // Very light gray
          200: '#EEEEEE',   // Your color #4 - light backgrounds
          300: '#E0E0E0',   // Light gray
          400: '#CBCBCB',   // Your color #3 - medium gray
          500: '#9E9E9E',   // Medium gray
          600: '#757575',   // Dark gray
          700: '#616161',   // Darker gray
          800: '#424242',   // Very dark gray
          900: '#212121',   // Almost black
          DEFAULT: '#CBCBCB', // Default secondary
        },
        
        // Accent color - Warm sage (for highlights and CTAs)
        accent: {
          50: '#F8F8F5',
          100: '#EEEFD9',
          200: '#DCDDB3',
          300: '#B7B89F',   // Your color #2 as accent base
          400: '#A5A68B',
          500: '#8B8C73',
          600: '#72735E',
          700: '#5A5B4A',
          800: '#434437',
          900: '#2C2D24',
          DEFAULT: '#B7B89F', // Default accent
        },
        
        // Semantic colors (status indicators)
        success: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#22C55E',   // Main success color
          600: '#16A34A',
          700: '#15803D',
          800: '#166534',
          900: '#14532D',
          DEFAULT: '#22C55E',
        },
        warning: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',   // Main warning color
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
          DEFAULT: '#F59E0B',
        },
        error: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#EF4444',   // Main error color
          600: '#DC2626',
          700: '#B91C1C',
          800: '#991B1B',
          900: '#7F1D1D',
          DEFAULT: '#EF4444',
        },
        info: {
          50: '#F0F9FF',
          100: '#E0F2FE',
          200: '#BAE6FD',
          300: '#7DD3FC',
          400: '#38BDF8',
          500: '#0EA5E9',   // Main info color
          600: '#0284C7',
          700: '#0369A1',
          800: '#075985',
          900: '#0C4A6E',
          DEFAULT: '#0EA5E9',
        },
        
        // Background and text colors (for easy reference)
        background: {
          light: '#FFFFFF',    // White background
          DEFAULT: '#F9FAFB',  // Very light gray (current body bg)
          dark: '#F5F5F5',     // Slightly darker for sections
        },
        text: {
          primary: '#111827',   // Almost black (current body text)
          secondary: '#4B5563', // Medium gray
          tertiary: '#9CA3AF',  // Light gray
          inverse: '#FFFFFF',   // White text
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
