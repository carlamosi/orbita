/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        space:  '#050508',
        violet: '#6C63FF',
        cyan:   '#00D4FF',
        coral:  '#FF6B6B',
        neon:   '#00FFB2',
        glass:  'rgba(255,255,255,0.04)',
      },
      fontFamily: {
        grotesk: ['"Space Grotesk"', 'sans-serif'],
        inter:   ['"Inter"', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      backdropBlur: {
        md: '12px',
      },
    },
  },
  plugins: [],
}
