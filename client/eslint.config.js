import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default [
  { ignores: ['dist'] },
  js.configs.recommended,
  reactHooks.configs.flat.recommended,
  reactRefresh.configs.vite,
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^_' }],
    },
  },
  {
    // El archivo de rutas define componentes lazy y exporta el router: no aplica fast refresh
    files: ['src/router.jsx'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
  {
    // Scripts de Node (generación de recursos, verificación de contraste)
    files: ['scripts/**/*.mjs', 'vite.config.js'],
    languageOptions: { globals: { ...globals.node } },
  },
];
