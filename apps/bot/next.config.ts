import type { NextConfig } from 'next'
const config: NextConfig = {
  transpilePackages: ['@fountem/db', '@fountem/detection', '@fountem/rag', '@fountem/verdict'],
}
export default config
