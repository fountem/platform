import type { NextConfig } from 'next'

const config: NextConfig = {
  transpilePackages: ['@fountem/ui', '@fountem/db', '@fountem/rag', '@fountem/verdict'],
}

export default config
