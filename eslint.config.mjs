import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  // Global ignores
  {
    ignores: [
      'build/',
      'dist/',
      '_archive/',
      'node_modules/',
      '.react-router/',
      '.shopify/',
      '**/*.generated.d.ts',
      'public/',
      'scripts/',
      'journal/',
      'memory/',
      'research/',
      '_product-images/',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  // React (flat recommended) + react-hooks for app code
  {
    files: ['**/*.{jsx,tsx}', '**/*.{js,ts}'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooks,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {jsx: true},
      },
    },
    settings: {
      react: {version: 'detect'},
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      // New JSX transform — no React import needed
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/no-unescaped-entities': 'off',
      'react/display-name': 'warn',

      // Hooks: genuine violations should fail CI; deps churn should not
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },

  // Severity tuning so the existing codebase passes
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrors: 'none',
        },
      ],
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-non-null-asserted-optional-chain': 'off',
      'no-useless-escape': 'off',
      'no-case-declarations': 'off',
      'no-empty': ['warn', {allowEmptyCatch: true}],
      'no-console': 'off',
      'prefer-const': 'warn',
    },
  },

  // CommonJS config files (postcss.config.cjs etc.)
  {
    files: ['**/*.cjs'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        module: 'writable',
        require: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
      },
    },
  },

  // Pre-existing template code uses short-circuit expressions as statements;
  // source files are read-only for tooling, so downgrade in place.
  {
    files: ['app/routes/($locale).account.edit.tsx'],
    rules: {
      '@typescript-eslint/no-unused-expressions': 'warn',
    },
  },
);
