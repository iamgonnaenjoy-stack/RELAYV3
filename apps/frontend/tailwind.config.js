/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // ─── Backgrounds (pure OLED) ───────────────────
        bg: {
          DEFAULT: '#000000',
          sidebar: '#060606',
          channels: '#0A0A0A',
          chat: '#000000',
          surface: '#111111',
          elevated: '#181818',
          hover: '#1C1C1C',
          active: '#222222',
        },
        // ─── Borders ───────────────────────────────────
        border: {
          DEFAULT: '#222222',
          divider: '#141414',
        },
        // ─── Standalone tokens for direct use ──────────
        divider: '#141414',
        accentSoft: 'rgba(88,101,242,0.12)',
        mentionBg: 'rgba(88,101,242,0.18)',
        // ─── Text ──────────────────────────────────────
        text: {
          primary: '#E6E8EB',
          secondary: '#A1A6B3',
          muted: '#6B7280',
          disabled: '#4B5563',
        },
        // ─── Accent (Blurple) ──────────────────────────
        accent: {
          DEFAULT: '#5865F2',
          hover: '#4752C4',
          active: '#3C45A5',
          soft: 'rgba(88,101,242,0.12)',
        },
        // ─── Status ────────────────────────────────────
        success: '#3BA55D',
        error: '#ED4245',
        warning: '#FAA61A',
        info: '#5865F2',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.75rem' }],
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.8125rem', { lineHeight: '1.25rem' }],
        base: ['0.9375rem', { lineHeight: '1.5rem' }],
      },
      borderRadius: {
        card: '10px',
        btn: '8px',
        input: '6px',
      },
      spacing: {
        1: '4px',
        2: '8px',
        3: '12px',
        4: '16px',
        5: '20px',
        6: '24px',
      },
      transitionDuration: {
        DEFAULT: '150ms',
        smooth: '200ms',
      },
      boxShadow: {
        elevation: '0 4px 20px rgba(0,0,0,0.25)',
        focus: '0 0 0 2px rgba(88,101,242,0.35)',
        none: 'none',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-8px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 150ms ease forwards',
        slideIn: 'slideIn 150ms ease forwards',
        scaleIn: 'scaleIn 150ms ease forwards',
      },
    },
  },
  plugins: [],
}
