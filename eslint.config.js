export default [
  {
    files: ['**/*.js', '**/*.cjs', '**/*.mjs'],
    rules: {
      'no-unused-vars': 'off',
      'no-undef': 'off',
    },
    ignores: ['dist/', 'node_modules/', 'data/'],
  },
]
