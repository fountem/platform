import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: { brand: { blue: '#3b82f6', dark: '#0a0f1e' } },
      fontFamily: { sans: ['Inter', '-apple-system', 'sans-serif'] },
    },
  },
}
export default config
