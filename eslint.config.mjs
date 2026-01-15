import cspellESLintPluginRecommended from '@cspell/eslint-plugin/recommended'
import js from '@eslint/js'
import vitest from '@vitest/eslint-plugin'
import importPlugin from 'eslint-plugin-import'
import jsdocPlugin from 'eslint-plugin-jsdoc'
import jsoncPlugin from 'eslint-plugin-jsonc'
import nodePlugin from 'eslint-plugin-n'
import noticePlugin from 'eslint-plugin-notice'
import * as regexpPlugin from 'eslint-plugin-regexp'
import eslintPluginUnicorn from 'eslint-plugin-unicorn'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import path from 'node:path'

export default tseslint.config(
  // Global ignores
  // https://eslint.org/docs/latest/use/configure/configuration-files-new#globally-ignoring-files-with-ignores
  {
    ignores: [
      // dependencies
      '**/node_modules/**',
      '.pnpm-store/**',
      '.codebase/**',

      // Outputs
      '**/.turbo/**',
      'coverage/**',
      'output/**',
      'target/**',
      '**/test/js',
      '**/dist/**',
      '**/lib/**',
      '.changeset/*',
      '**/CHANGELOG.md',
      '**/*.spec.ts',
      '**/*.test.ts',
      '**/__test__/**',

      // Configs
      'eslint.config.js',
      'vitest.config.ts',
      '**/rslib.config.ts',
      'eslint.config.mjs',
      '.commitlintrc.js',
      '**/vitest.config.ts',

      // Ignored packages
      'packages/**/vitest.config.ts',
      'website/**',
      'tools/configs/**',
      '**/tools/make-new-component/examplesTemplate/**',
      '**/tools/make-new-component/template/**',

      // Submodule
      'lunarium/**',
    ],
  },
  js.configs.recommended,
  cspellESLintPluginRecommended,
  ...jsoncPlugin.configs['flat/recommended-with-jsonc'],
  regexpPlugin.configs['flat/recommended'],
  // // Rules from eslint-plugin-jsdoc
  {
    files: ['**/*.{ts,tsx}'],
    ...jsdocPlugin.configs['flat/recommended-typescript'],

    rules: {
      'jsdoc/check-tag-names': [
        'warn',
        {
          // https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/check-tag-names.md#options
          definedTags: [
            // api-extractor
            'alpha',
            'defaultValue',
            'note',
            'packageDocumentation',
            'public',
            'remarks',
            'Android',
            'iOS',
            'Harmony',
            'experimental',
            'zh',
            'docTypeFallback',
            'Web',
            'hidden',
            'Clay',
            'eventProperty',
            // Vitest
            'jest-environment',
            'vitest-environment',
          ],
          enableFixer: false,
        },
      ],
    },
  },
  {
    files: ['**/*.{js,cjs,mjs,jsx}'],
    ...jsdocPlugin.configs['flat/recommended'],
  },
  {
    rules: {
      'jsdoc/require-jsdoc': 'off',
      'jsdoc/require-returns': 'off',
      'jsdoc/check-alignment': 'off',

      'jsdoc/tag-lines': 'off',
    },
  },
  // Rules from eslint-plugin-n
  nodePlugin.configs['flat/recommended-module'],
  {
    rules: {
      'n/prefer-node-protocol': 'error',
      'n/no-extraneous-import': [
        'error',
        {
          allowModules: ['vitest'],
        },
      ],
      'n/no-unpublished-import': 'off',
      'n/no-missing-import': 'off',
      'n/hashbang': 'off',
    },
  },
  // Rules from eslint-plugin-unicorn
  {
    plugins: {
      unicorn: eslintPluginUnicorn,
    },
    rules: {
      'unicorn/consistent-function-scoping': 'off',
      'unicorn/empty-brace-spaces': 'error',
      'unicorn/expiring-todo-comments': 'error',
      'unicorn/no-abusive-eslint-disable': 'error',
      'unicorn/no-anonymous-default-export': 'error',
      'unicorn/no-array-callback-reference': 'error',
      'unicorn/no-array-push-push': 'error',
      'unicorn/no-await-expression-member': 'error',
      'unicorn/no-await-in-promise-methods': 'error',
      'unicorn/no-console-spaces': 'error',
      'unicorn/no-hex-escape': 'error',
      'unicorn/no-invalid-remove-event-listener': 'error',
      'unicorn/no-lonely-if': 'error',
      'unicorn/no-negated-condition': 'error',
      'unicorn/no-nested-ternary': 'error',
      'no-nested-ternary': 'off',
      'unicorn/no-new-array': 'error',
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    plugins: {
      notice: noticePlugin,
    },
    rules: {
      'notice/notice': [
        'error',
        {
          template:
            '// Copyright 2026 The Lynx Authors. All rights reserved.\n// Licensed under the Apache License Version 2.0 that can be found in the\n// LICENSE file in the root directory of this source tree.\n',
        },
      ],
    },
  },
  // Import-related
  importPlugin.flatConfigs.recommended,
  importPlugin.flatConfigs.typescript,
  {
    settings: {
      'import/resolver': {
        typescript: {
          project: './tsconfig.json',
        },
      },
      'import/internal-regex': '^@(lynx-js)/',
    },
    rules: {
      'import/no-commonjs': 'error',
      'import/no-cycle': 'error',
      'import/no-unresolved': [
        'error',
        {
          ignore: ['vscode'],
        },
      ],
      'import/first': 'error',
      'import/newline-after-import': 'error',
      'import/order': [
        'error',
        {
          groups: [
            'builtin', // Built-in imports (come from NodeJS native) go first
            'external', // <- External imports
            'internal', // <- Absolute imports
            ['sibling', 'parent'], // <- Relative imports, the sibling and parent types they can be mingled together
            'index', // <- index imports
            'unknown', // <- unknown
          ],
          'newlines-between': 'always',
          alphabetize: {
            /* sort in ascending order. Options: ["ignore", "asc", "desc"] */
            order: 'asc',
            /* ignore case. Options: [true, false] */
            caseInsensitive: true,
          },
          pathGroups: [
            {
              pattern: '@lynx-js/react',
              group: 'builtin',
            },
            {
              pattern: '@/types',
              group: 'external',
              position: 'before',
            },
            {
              pattern: '@lynx-js/**',
              group: 'external',
            },
          ],
        },
      ],
      'import/consistent-type-specifier-style': 'warn',
      'sort-imports': [
        'error',
        {
          ignoreCase: false,
          ignoreDeclarationSort: true, // don"t want to sort import lines, use eslint-plugin-import instead
          ignoreMemberSort: false,
          memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single'],
          allowSeparatedGroups: true,
        },
      ],
    },
  },
  {
    languageOptions: {
      globals: {
        ...globals.nodeBuiltin,
        ...globals.es2021,
      },
    },
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
  },
  // TypeScript-related
  {
    files: ['**/*.ts', '**/*.tsx'],
    ignores: ['**/*.md/**'],
    extends: [
      tseslint.configs.eslintRecommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
    ],
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        projectService: {
          allowDefaultProject: ['*.js'],
          defaultProject: path.resolve(import.meta.dirname, 'tsconfig.json'),
        },
      },
    },
  },
  // JavaScript-related
  {
    files: ['**/*.{js,jsx,cjs,mjs}'],
    extends: [tseslint.configs.disableTypeChecked],
    rules: {
      // turn off other type-aware rules
      'deprecation/deprecation': 'off',
      '@typescript-eslint/internal/no-poorly-typed-ts-props': 'off',

      // turn off rules that don't apply to JS code
      '@typescript-eslint/explicit-function-return-type': 'off',
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
        jsxPragma: null,
      },
    },
  },
  {
    files: [
      'e2e/**',
      'examples/**/*.{js,mjs,cjs,jsx,ts,tsx}',
      'website/**/*.{js,mjs,cjs,jsx,ts,tsx}',
    ],
    languageOptions: {
      globals: globals.browser,
      parser: tseslint.parser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        jsxPragma: null,
      },
    },
  },
  // Vitest-related
  {
    files: ['**/*.test.ts', '**/*.test-d.ts'],
    plugins: {
      vitest,
    },
    rules: {
      ...vitest.configs.recommended.rules,
    },
    settings: {
      vitest: {
        typecheck: true,
      },
    },
    languageOptions: {
      globals: {
        ...vitest.environments.env.globals,
      },
    },
  },
  // CommonJS-related
  {
    files: ['**/*.cjs'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
      parserOptions: {
        sourceType: 'commonjs',
      },
    },
    rules: {
      'import/no-commonjs': 'off',
    },
  },
  {
    rules: {
      // Migrated to biomejs
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/adjacent-overload-signatures': 'off',
      '@typescript-eslint/array-type': 'off',
      '@typescript-eslint/consistent-type-exports': 'off',
      '@typescript-eslint/consistent-type-imports': 'off',
      'default-param-last': 'off',
      '@typescript-eslint/default-param-last': 'off',
      'no-empty': 'off',
      'no-empty-static-block': 'off',
      'no-empty-function': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-extra-non-null-assertion': 'off',
      '@typescript-eslint/no-inferrable-types': 'off',
      '@typescript-eslint/no-invalid-void-type': 'off',
      '@typescript-eslint/no-misused-new': 'off',
      '@typescript-eslint/no-namespace': 'off',
      'no-redeclare': 'off',
      '@typescript-eslint/no-redeclare': 'off',
      '@typescript-eslint/no-this-alias': 'off',
      '@typescript-eslint/no-unnecessary-type-constraint': 'off',
      '@typescript-eslint/no-unsafe-declaration-merging': 'off',
      'no-use-before-define': 'off',
      '@typescript-eslint/no-use-before-define': 'off',
      'no-useless-constructor': 'off',
      '@typescript-eslint/no-useless-constructor': 'off',
      '@typescript-eslint/no-useless-empty-export': 'off',
      'no-throw-literal': 'off',
      '@typescript-eslint/only-throw-error': 'off',
      '@typescript-eslint/prefer-as-const': 'off',
      '@typescript-eslint/prefer-enum-initializers': 'off',
      '@typescript-eslint/prefer-for-of': 'off',
      '@typescript-eslint/prefer-function-type': 'off',
      '@typescript-eslint/prefer-literal-enum-member': 'off',
      '@typescript-eslint/prefer-optional-chain': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
    },
  },
)
