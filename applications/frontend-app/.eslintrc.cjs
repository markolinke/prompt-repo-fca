module.exports = {
    root: true,
    env: {
      node: true,
      browser: true,
      es2021: true,
    },
    extends: [
      'eslint:recommended',
      'plugin:vue/vue3-essential',
      'plugin:vue/vue3-strongly-recommended',
      'plugin:@typescript-eslint/recommended',
    ],
    parser: 'vue-eslint-parser',
    parserOptions: {
      parser: '@typescript-eslint/parser',
      ecmaVersion: 2021,
      sourceType: 'module',
    },
    plugins: ['vue', '@typescript-eslint'],
    rules: {
      // Add custom rules here
    },
  }