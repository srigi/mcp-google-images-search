import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier'; // We still need this to apply its disabling rules

export default tseslint.config(
  {
    ignores: ['.data/', '.out/', 'node_modules/', 'prisma/client/'],
  },

  eslint.configs.recommended,
  ...tseslint.configs.recommended, // Apply recommended TS rules
  {
    rules: { '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }] },
  },

  // Prettier integration - MUST BE LAST to override other configs
  {
    plugins: { prettier: prettierPlugin },
    rules: {
      ...prettierConfig.rules, // Apply prettier-config to disable conflicting rules
      'prettier/prettier': 'warn', // Report Prettier differences as warnings
    },
  },
);
