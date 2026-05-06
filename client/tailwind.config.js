/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#080810',
        card: '#10101E',
        primary: '#7C6AF7',
        secondary: '#00E5A0',
        text: '#EFEFEF',
        muted: '#7A7A9A',
        border: '#1E1E32',
      },
      fontFamily: {
        display: ['Sora', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '10px',
        lg: '16px',
      },
      boxShadow: {
        glow: '0 0 24px rgba(124,106,247,0.2)',
        'glow-green': '0 0 24px rgba(0,229,160,0.2)',
      },
      backgroundImage: {
        'gradient-arc': 'linear-gradient(135deg, #7C6AF7, #00E5A0)',
      },
    },
  },
  plugins: [],
};
