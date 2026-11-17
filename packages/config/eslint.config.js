import js from '@eslint/js';
import tseslint from 'typescript-eslint';

/** Shared strict TypeScript rules. Consumers append framework-specific configs. */
export default tseslint.config(
  { ignores: ['**/dist/**', '**/.next/**', '**/generated/**', '**/coverage/**'] },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: { allowDefaultProject: ['*.config.ts'] },
        // Lint runs per package (turbo), so resolve tsconfig files from that package.
        tsconfigRootDir: process.cwd(),
      },
    },
    rules: {
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['**/*.js', '**/*.mjs'],
    ...tseslint.configs.disableTypeChecked,
  },
);
