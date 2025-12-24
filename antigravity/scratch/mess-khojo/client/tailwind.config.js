/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#4B2E83',
          'primary-hover': '#3F256F',
          secondary: '#F8F7F3',
          'accent-blue': '#3B82F6',
          'accent-green': '#22C55E',
          'light-gray': '#EDEAF4',
          'text-dark': '#1F2937',
          'text-gray': '#6B7280',
          white: '#FFFFFF',
          amber: '#F59E0B',
          red: '#EF4444'
        },
        neu: {
          base: '#E0E5EC',
          text: '#4A5568',
          accent: '#667EEA',
          'accent-hover': '#5A67D8',
          shadow: {
            light: 'rgba(255, 255, 255, 0.5)',
            dark: 'rgba(163, 177, 198, 0.6)',
          }
        },
        'neu-dark': {
          base: '#2D3748', // Dark Gray
          text: '#FFFFFF', // True White
          accent: '#A78BFA',
          shadow: {
            light: '#4A5568',
            dark: '#1A202C',
          }
        }
      },
      boxShadow: {
        'neu-out': '9px 9px 16px rgb(163,177,198,0.6), -9px -9px 16px rgba(255,255,255, 0.5)',
        'neu-in': 'inset 6px 6px 10px 0 rgba(163,177,198, 0.7), inset -6px -6px 10px 0 rgba(255,255,255, 0.8)',
        'neu-btn': '6px 6px 10px 0 rgba(163,177,198, 0.7), -6px -6px 10px 0 rgba(255,255,255, 0.8)',

        // Dark Theme Shadows
        'neu-dark-out': '8px 8px 16px #16191b, -8px -8px 16px #2c3137',
        'neu-dark-in': 'inset 8px 8px 16px #16191b, inset -8px -8px 16px #2c3137',
        'neu-dark-btn': '5px 5px 10px #16191b, -5px -5px 10px #2c3137',
      }
    },
  },
  plugins: [],
}

