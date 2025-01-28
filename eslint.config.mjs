import gjs from './lint/eslintrc-gjs.mjs';
import shell from './lint/eslintrc-shell.mjs';

export default [
  // Spread the configurations from the imported files
  ...gjs,
  ...shell,
  {
    ignores: ['docs/**'],
    languageOptions: {
      sourceType: 'module',
      ecmaVersion: 2022,
    }
  }
];
