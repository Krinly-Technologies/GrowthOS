import base from '@krinly/config/eslint';

export default [
  ...base,
  {
    rules: {
      // Nest modules are classes with decorators and no members.
      '@typescript-eslint/no-extraneous-class': ['error', { allowWithDecorator: true }],
    },
  },
];
