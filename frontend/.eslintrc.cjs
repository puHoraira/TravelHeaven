module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: [
    'dist',
    '.eslintrc.cjs',
    // Exclude backup/legacy copies that aren't part of the app build.
    '**/*_backup.jsx',
    '**/*_backup.js',
    '**/*Old.jsx',
    '**/*Old.js',
  ],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  settings: { react: { version: '18.2' } },
  rules: {
    // This codebase doesn't use PropTypes consistently; enforce via TS or runtime checks instead.
    'react/prop-types': 'off',

    // Keep lint signal, but don't fail CI/build on unused vars in existing code.
    'no-unused-vars': 'warn',

    // Allow quotes/apostrophes in JSX text.
    'react/no-unescaped-entities': 'off',
  },
}
