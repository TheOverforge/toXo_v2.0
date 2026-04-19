/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'bg-dark':     'var(--bg-dark)',
        'bg-panel':    'var(--bg-panel)',
        'glass':       'var(--glass)',
        'glass-hover': 'var(--glass-hover)',
        'accent':      'var(--accent)',
        'tx':          'var(--text)',
        'tx-sec':      'var(--text-sec)',
        'tx-done':     'var(--text-done)',
        'danger':      'var(--danger)',
      },
      borderColor: {
        DEFAULT: 'var(--glass-border)',
        glass:   'var(--glass-border)',
      },
      fontFamily: {
        sans: ['"Segoe UI"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
