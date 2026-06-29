import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import globals from 'globals'
import nextPlugin from '@next/eslint-plugin-next'

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/.next/**',
      '**/dist/**',
      '**/.turbo/**',
      'eval-results/**',
      'services/resolver/**', // Python service, linted separately
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // Register the Next.js plugin so its rules resolve for the apps (and any
    // `eslint-disable @next/next/*` directives are recognised). `next lint`
    // is deprecated; we lint with the flat config directly.
    files: ['apps/**/*.{ts,tsx}'],
    plugins: { '@next/next': nextPlugin },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
      // App Router only — no `pages/` dir, so this page-link rule is N/A.
      '@next/next/no-html-link-for-pages': 'off',
    },
  },
  {
    languageOptions: {
      globals: { ...globals.node, ...globals.browser },
    },
    rules: {
      // Pragmatic: surface real bugs, don't block on stylistic noise.
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-require-imports': 'off',
      'no-empty': ['warn', { allowEmptyCatch: true }],
      'no-control-regex': 'off',
    },
  },
  {
    // Test files use jest globals.
    files: ['**/__tests__/**/*.ts', '**/*.test.ts'],
    languageOptions: { globals: { ...globals.jest } },
  }
)
