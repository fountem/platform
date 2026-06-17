import type { NextConfig } from 'next'
const config: NextConfig = {
  transpilePackages: ['@fountem/db', '@fountem/detection', '@fountem/verdict', '@fountem/core', '@fountem/ui'],
}
export default config
