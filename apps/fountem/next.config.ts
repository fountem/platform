import type { NextConfig } from 'next'
const config: NextConfig = {
  transpilePackages: ['@fountem/db', '@fountem/rag', '@fountem/verdict', '@fountem/ui'],
}
export default config
