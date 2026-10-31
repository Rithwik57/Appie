import js from '@eslint/js';
import globals from 'globals';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

const restricted = (patterns) => ['error', { patterns: patterns.map((group) => ({ group: [group], message: 'This import violates the Appie layer boundary.' })) }];

export default tseslint.config(
  { ignores: ['dist/', 'node_modules/', '.browser-profile/', '.browser-verify.mjs', '.agents/'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      'jsx-a11y': jsxA11y,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  {
    files: ['src/domain/**'],
    rules: {
      'no-restricted-imports': restricted(['**/data/*', '**/integrations/*', '**/app/*', '**/review/*', '**/presentation/*', '**/lib/*', 'react', 'react-dom', 'react-router-dom', 'lucide-react']),
    },
  },
  {
    files: ['src/data/**', 'src/integrations/**'],
    rules: {
      'no-restricted-imports': restricted(['**/app/*', '**/review/*', '**/presentation/*', '**/data/*', '**/integrations/*', 'react', 'react-dom', 'react-router-dom', 'lucide-react']),
    },
  },
  {
    files: ['src/app/**'],
    rules: { 'no-restricted-imports': restricted(['**/review/*', '**/presentation/*']) },
  },
  {
    files: ['src/review/**'],
    rules: { 'no-restricted-imports': restricted(['**/presentation/*', '**/data/*', '**/integrations/*']) },
  },
  {
    files: ['src/presentation/**'],
    rules: { 'no-restricted-imports': restricted(['**/data/*', '**/integrations/*']) },
  },
  {
    files: ['**/*.test.{ts,tsx}'],
    rules: { 'no-restricted-imports': 'off' },
  },
);
