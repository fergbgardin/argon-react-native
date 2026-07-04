/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#121212',
        card: '#1E1E1E',
        'card-hover': '#252525',
        border: '#2A2A2A',
        line: '#333333',
        primary: '#C084FC',
        'primary-dark': '#A855F7',
        muted: '#71717A',
        success: '#22C55E',
        danger: '#EF4444',
        warning: '#F59E0B',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
