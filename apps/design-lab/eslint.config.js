import base from '@krinly/config/eslint';
import nextVitals from 'eslint-config-next/core-web-vitals';

const config = [
  ...nextVitals,
  ...base,
  // Next.js config files are part of this app's tsconfig, so no default project is needed.
  { files: ['**/*.ts', '**/*.tsx'], languageOptions: { parserOptions: { projectService: true } } },
  { ignores: ['next-env.d.ts', '.next/**', 'screenshots/**'] },
];

export default config;
