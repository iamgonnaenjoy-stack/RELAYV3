/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#000000',
          panel: '#090A0D',
          elevated: '#101217',
          soft: '#13161D',
          hover: '#171B24',
        },
        border: {
          DEFAULT: '#1C1F27',
          soft: '#14171D',
        },
        text: {
          primary: '#F5F7FA',
          secondary: '#A7AFBF',
          muted: '#6B7280',
        },
        accent: {
          DEFAULT: '#5865F2',
          hover: '#4752C4',
          soft: 'rgba(88,101,242,0.14)',
        },
        success: '#3BA55D',
        error: '#ED4245',
        warning: '#FAA61A',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        panel: '18px',
        control: '12px',
      },
      boxShadow: {
        glow: '0 18px 45px rgba(0, 0, 0, 0.45)',
        focus: '0 0 0 2px rgba(88,101,242,0.35)',
      },
    },
  },
  plugins: [],
}
