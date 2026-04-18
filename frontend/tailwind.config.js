/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        mmt: {
          purple: {
            DEFAULT: '#7C3AED',
            light:   '#A78BFA',
            dark:    '#5B21B6',
            50:      '#F5F3FF',
            100:     '#EDE9FE',
          },
          celeste: {
            DEFAULT: '#38BDF8',
            light:   '#7DD3FC',
            dark:    '#0284C7',
            50:      '#F0F9FF',
            100:     '#E0F2FE',
          },
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 12px 0 rgba(124, 58, 237, 0.08)',
        'card-hover': '0 8px 24px 0 rgba(124, 58, 237, 0.18)',
      },
    },
  },
  plugins: [],
}
