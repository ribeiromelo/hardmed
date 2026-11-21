/** The authenticated app is compiled locally; public pages keep their existing styles. */
module.exports = {
  content: ['./src/**/*.{ts,tsx}', './public/static/*.js'],
  theme: {
    extend: {
      colors: {
        theme: {
          primary: 'rgb(var(--app-bg) / <alpha-value>)',
          secondary: 'rgb(var(--app-surface) / <alpha-value>)',
          tertiary: 'rgb(var(--app-soft) / <alpha-value>)',
          DEFAULT: 'rgb(var(--app-border) / <alpha-value>)',
        },
        text: {
          primary: 'rgb(var(--app-text) / <alpha-value>)',
          secondary: 'rgb(var(--app-muted) / <alpha-value>)',
          tertiary: 'rgb(var(--app-muted) / <alpha-value>)',
        },
        primary: { 500: 'rgb(var(--app-link) / <alpha-value>)', 600: 'rgb(var(--app-link) / <alpha-value>)' },
        ink: { 100: '#eee5dc', 300: '#b8aba3', 400: '#66574f', 500: 'rgb(var(--app-link) / <alpha-value>)', 600: '#1b1411', 700: '#2e241f', 800: '#1b1411', 900: '#1b1411' },
        navy: { 100: '#bacde0', 400: 'rgb(var(--app-link) / <alpha-value>)', 500: 'rgb(var(--app-link) / <alpha-value>)', 600: '#1f3954', 700: '#172d43', 800: '#152b40' },
        accent: { 100: '#daf5e6', 500: '#33cc7a', 600: '#27b66a' },
        green: { 500: 'rgb(var(--app-link) / <alpha-value>)' },
        blue: { 400: 'rgb(var(--app-info) / <alpha-value>)', 500: 'rgb(var(--app-info) / <alpha-value>)' },
        red: { 400: 'rgb(var(--app-error) / <alpha-value>)', 500: 'rgb(var(--app-error) / <alpha-value>)' },
        yellow: { 400: 'rgb(var(--app-warning) / <alpha-value>)', 500: 'rgb(var(--app-warning) / <alpha-value>)' },
      },
      fontFamily: {
        sans: ['Host Grotesk', 'sans-serif'],
        heading: ['Host Grotesk', 'sans-serif'],
        display: ['Host Grotesk', 'sans-serif'],
      },
    },
  },
};
