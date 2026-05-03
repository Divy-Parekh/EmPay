/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        'primary-hover': 'var(--color-primary-hover)',
        'primary-light': 'var(--color-primary-light)',
        surface: 'var(--bg-card)',
        'surface-hover': 'var(--bg-card-hover)',
        body: 'var(--bg-body)',
        sidebar: 'var(--bg-sidebar)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        danger: 'var(--color-danger)',
        info: 'var(--color-info)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: 'var(--border-radius)',
        'card-sm': 'var(--border-radius-sm)',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        modal: 'var(--shadow-modal)',
      },
      spacing: {
        sidebar: 'var(--sidebar-width)',
        navbar: 'var(--navbar-height)',
      },
    },
  },
  plugins: [],
};
