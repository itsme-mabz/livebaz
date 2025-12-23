/** @type {import('tailwindcss').Config} */
// NOTE: This config is NOT used when using Tailwind CDN in index.html
// The CDN version is currently active and doesn't support custom configuration
// Using standard Tailwind colors: yellow-400 for primary color
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#ffc107',
        'primary-dark': '#ffca2c',
        dark: {
          100: '#1a1a1a',
          200: '#0d0d0d',
          300: '#000000',
        }
      },
    },
  },
  plugins: [],
}
