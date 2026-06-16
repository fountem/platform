import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: { brand: { red: '#ef4444', dark: '#1d1d1f' } },
      fontFamily: { sans: ['Inter', '-apple-system', 'sans-serif'] },
    },
  },
}
export default config
