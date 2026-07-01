import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

const config: Config = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--color-bg)',
        surface: 'var(--color-surface)',
        'surface-2': 'var(--color-surface-2)',
        border: 'var(--color-border)',
        'border-hover': 'var(--color-border-hover)',
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-muted': 'var(--color-text-muted)',
        accent: 'var(--color-accent)',
        'accent-text': 'var(--color-accent-text)',
        error: 'var(--color-error)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        'admin-bg': 'var(--color-admin-bg)',
        'admin-surface': 'var(--color-admin-surface)',
        'admin-surface-2': 'var(--color-admin-surface-2)',
        'admin-border': 'var(--color-admin-border)',
        'admin-text': 'var(--color-admin-text)',
        'admin-text-muted': 'var(--color-admin-text-muted)',
        'admin-accent': 'var(--color-admin-accent)',
        'admin-accent-hover': 'var(--color-admin-accent-hover)',
        'admin-success': 'var(--color-admin-success)',
        'admin-warning': 'var(--color-admin-warning)',
        'admin-error': 'var(--color-admin-error)',
        'admin-purple': 'var(--color-admin-purple)',
      },
      fontFamily: {
        syne: ['Syne', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'check-draw': {
          '0%': { strokeDashoffset: '100' },
          '100%': { strokeDashoffset: '0' },
        },
      },
      animation: {
        marquee: 'marquee 30s linear infinite',
        'check-draw': 'check-draw 0.6s ease-out forwards',
      },
    },
  },
  plugins: [animate],
};

export default config;
