import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
export default [
  { ignores: ['dist/**', 'node_modules/**', 'public/**', 'vendor/**', 'release/**'] },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx,cjs}'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { react },
    rules: {
      'no-empty': ['error', { allowEmptyCatch: true }],
      'react/jsx-uses-vars': 'error',
      'no-unused-vars': [
        'error',
        { args: 'none', ignoreRestSiblings: true, varsIgnorePattern: '^_' },
      ],
    },
  },
];
