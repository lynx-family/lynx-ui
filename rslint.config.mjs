// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import cspellESLintPluginRecommended from '@cspell/eslint-plugin/recommended'
import {
  defineConfig,
  globalIgnores,
  globals,
  importPlugin as nativeImportPlugin,
  js,
  nodePlugin as nativeNodePlugin,
  reactHooksPlugin,
  ts,
} from '@rslint/core'
import vitest from '@vitest/eslint-plugin'
import eslintImportPlugin from 'eslint-plugin-import'
import jsdocPlugin from 'eslint-plugin-jsdoc'
import eslintNodePlugin from 'eslint-plugin-n'
import noticePlugin from 'eslint-plugin-notice'
import * as regexpPlugin from 'eslint-plugin-regexp'
import unicornESLintPlugin from 'eslint-plugin-unicorn'
import path from 'node:path'

const TYPESCRIPT_FILES = ['**/*.ts', '**/*.tsx']
const JAVASCRIPT_FILES = ['**/*.{js,jsx,mjs,cjs}']
const PROJECT_SERVICE_FILES = [
  'apps/**/*.{ts,tsx}',
  'luna/**/*.{ts,tsx}',
  'packages/**/*.{ts,tsx}',
]
const BIOME_RULE_IGNORES = ['tools/**']

function scopeConfigs(configs, files, ignores = []) {
  const entries = Array.isArray(configs) ? configs : [configs]
  return entries.map(config => ({
    ...config,
    files,
    ignores: [...(config.ignores ?? []), ...ignores],
  }))
}

// The existing Unicorn configuration contains rules that are not all available
// in Rslint 0.9.3. Keep the JavaScript implementation until native parity is
// available.
const unicornRules = {
  'unicorn-js/consistent-function-scoping': 'off',
  'unicorn-js/explicit-length-check': 'error',
  'unicorn-js/expiring-todo-comments': 'error',
  'unicorn-js/no-abusive-eslint-disable': 'error',
  'unicorn-js/no-anonymous-default-export': 'error',
  'unicorn-js/no-array-callback-reference': 'error',
  'unicorn-js/no-array-push-push': 'error',
  'unicorn-js/no-console-spaces': 'error',
  'unicorn-js/no-hex-escape': 'error',
  'unicorn-js/no-lonely-if': 'error',
  'unicorn-js/no-negated-condition': 'error',
  'unicorn-js/no-nested-ternary': 'error',
  'unicorn-js/no-new-array': 'error',
  'unicorn-js/no-instanceof-array': 'error',
  'unicorn-js/prefer-number-properties': 'off',
}

// eslint-plugin-notice still uses two pre-flat-config context helpers.
const originalNoticeCreate = noticePlugin.rules.notice.create
noticePlugin.rules.notice.create = function(context) {
  if (typeof context.getFilename !== 'function') {
    context.getFilename = () => context.filename || ''
  }
  if (typeof context.getSourceCode !== 'function') {
    context.getSourceCode = () => context.sourceCode
  }
  return originalNoticeCreate.call(this, context)
}

// eslint-plugin-import's order rule still uses two SourceCode aliases that
// Rslint's JavaScript-plugin bridge does not expose yet.
const originalImportOrderCreate = eslintImportPlugin.rules.order.create
eslintImportPlugin.rules.order.create = function(context) {
  const sourceCode = context.sourceCode
  if (typeof sourceCode.getTokenOrCommentBefore !== 'function') {
    sourceCode.getTokenOrCommentBefore = node =>
      sourceCode.getTokenBefore(node, { includeComments: true })
  }
  if (typeof sourceCode.getTokenOrCommentAfter !== 'function') {
    sourceCode.getTokenOrCommentAfter = node =>
      sourceCode.getTokenAfter(node, { includeComments: true })
  }
  return originalImportOrderCreate.call(this, context)
}

export default defineConfig([
  globalIgnores([
    '**/node_modules/**',
    '.pnpm-store/**',
    '.codebase/**',
    '.vscode/**',
    '**/.turbo/**',
    'coverage/**',
    'output/**',
    'target/**',
    '**/test/js',
    '**/dist/**',
    '**/lib/**',
    '**/*.lynx.bundle',
    '**/*.web.bundle',
    '.changeset/*',
    '**/CHANGELOG.md',
    'rslint.config.mjs',
    '.commitlintrc.js',
    '**/rslib.config.ts',
    '**/vitest.config.ts',
    'website/**',
    'tools/typings/**/*.d.ts',
    '**/tools/make-new-component/examplesTemplate/**',
    '**/tools/make-new-component/template/**',
  ]),
  js.configs.recommended,
  {
    rules: {
      'no-useless-assignment': 'off',
      'preserve-caught-error': 'off',
    },
  },
  cspellESLintPluginRecommended,
  {
    rules: {
      '@cspell/spellchecker': [
        'warn',
        { configFile: path.resolve(import.meta.dirname, 'cspell.jsonc') },
      ],
    },
  },
  regexpPlugin.configs['flat/recommended'],
  {
    files: TYPESCRIPT_FILES,
    ...jsdocPlugin.configs['flat/recommended-typescript'],
    rules: {
      ...jsdocPlugin.configs['flat/recommended-typescript'].rules,
      'jsdoc/check-tag-names': [
        'warn',
        {
          definedTags: [
            'alpha',
            'defaultValue',
            'note',
            'packageDocumentation',
            'public',
            'remarks',
            'Android',
            'iOS',
            'Harmony',
            'PC',
            'experimental',
            'zh',
            'docTypeFallback',
            'Web',
            'hidden',
            'Clay',
            'eventProperty',
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
      'jsdoc/require-param': ['warn', { enableFixer: false }],
      'jsdoc/require-returns': 'off',
      'jsdoc/check-alignment': 'off',
      'jsdoc/tag-lines': 'off',
    },
  },
  {
    files: [
      'packages/lynx-ui-input/src/NativeTypings.d.ts',
      'packages/lynx-ui-input/src/types/index.docs.ts',
      'packages/lynx-ui-scroll-view/src/types/index.docs.ts',
    ],
    // These @since values are Lynx runtime major.minor versions, not SemVer.
    rules: { 'jsdoc/check-values': 'off' },
  },
  nativeNodePlugin.configs.recommendedModule,
  {
    rules: {
      'node/prefer-node-protocol': 'error',
      'node/no-extraneous-import': ['error', { allowModules: ['vitest'] }],
      'node/no-unpublished-import': 'off',
      'node/no-missing-import': 'off',
      'node/hashbang': 'off',
    },
  },
  {
    plugins: { 'node-js': eslintNodePlugin },
    rules: {
      // These recommended eslint-plugin-n rules are not native in Rslint.
      'node-js/no-unpublished-bin': 'error',
      'node-js/process-exit-as-throw': 'error',
    },
  },
  {
    plugins: { 'unicorn-js': unicornESLintPlugin },
    rules: unicornRules,
  },
  {
    plugins: ['unicorn'],
    rules: {
      'unicorn/empty-brace-spaces': 'error',
      'unicorn/error-message': 'error',
      'unicorn/new-for-builtins': 'error',
      'unicorn/no-await-expression-member': 'error',
      'unicorn/no-await-in-promise-methods': 'error',
      'unicorn/no-invalid-remove-event-listener': 'error',
      'unicorn/no-useless-switch-case': 'error',
      'unicorn/prefer-array-flat-map': 'error',
      'unicorn/prefer-date-now': 'error',
      'unicorn/prefer-node-protocol': 'error',
      'unicorn/prefer-number-properties': 'error',
    },
  },
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    plugins: { notice: noticePlugin },
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
  nativeImportPlugin.configs.recommended,
  {
    plugins: ['import'],
    settings: {
      'import/internal-regex': '^@(lynx-js)/',
    },
    rules: {
      'import/no-cycle': 'error',
      'import/first': 'error',
      'import/newline-after-import': 'error',
      'sort-imports': [
        'error',
        {
          ignoreCase: false,
          ignoreDeclarationSort: true,
          ignoreMemberSort: false,
          memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single'],
          allowSeparatedGroups: true,
        },
      ],
    },
  },
  {
    plugins: { 'import-js': eslintImportPlugin },
    settings: {
      'import/resolver': { typescript: { project: './tsconfig.json' } },
      'import/internal-regex': '^@(lynx-js)/',
    },
    rules: {
      // These rules are not implemented natively yet. Keep their existing
      // eslint-plugin-import behavior through Rslint's JavaScript bridge.
      'import-js/export': 'error',
      'import-js/no-named-as-default': 'warn',
      'import-js/no-named-as-default-member': 'warn',
      'import-js/no-commonjs': 'error',
      'import-js/no-unresolved': ['error', { ignore: ['vscode'] }],
      'import-js/consistent-type-specifier-style': 'warn',
      'import-js/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            ['sibling', 'parent'],
            'index',
            'unknown',
          ],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
          pathGroups: [
            { pattern: '@lynx-js/react', group: 'builtin' },
            { pattern: '@/types', group: 'external', position: 'before' },
            { pattern: '@lynx-js/**', group: 'external' },
          ],
        },
      ],
    },
  },
  {
    languageOptions: {
      globals: { ...globals.nodeBuiltin, ...globals.es2021 },
    },
    linterOptions: { reportUnusedDisableDirectives: true },
  },
  // Keep syntax-only coverage for every TypeScript file. Type-aware presets
  // are layered below for files that were type-checked by the previous ESLint
  // configuration.
  ...scopeConfigs(ts.configs.recommended, TYPESCRIPT_FILES),
  ...scopeConfigs(ts.configs.stylistic, TYPESCRIPT_FILES),
  ...scopeConfigs(ts.configs.recommendedTypeChecked, PROJECT_SERVICE_FILES, [
    'packages/**/*.{test,spec}.ts',
    'packages/**/*.{test,spec}.tsx',
    'apps/**/*.{test,spec}.ts',
    'apps/**/*.{test,spec}.tsx',
  ]),
  ...scopeConfigs(ts.configs.stylisticTypeChecked, PROJECT_SERVICE_FILES, [
    'packages/**/*.{test,spec}.ts',
    'packages/**/*.{test,spec}.tsx',
    'apps/**/*.{test,spec}.ts',
    'apps/**/*.{test,spec}.tsx',
  ]),
  ...scopeConfigs(ts.configs.recommendedTypeChecked, ['tools/**/*.{ts,tsx}'], [
    'tools/**/*.{test,spec}.ts',
    'tools/**/*.{test,spec}.tsx',
  ]),
  ...scopeConfigs(ts.configs.stylisticTypeChecked, ['tools/**/*.{ts,tsx}'], [
    'tools/**/*.{test,spec}.ts',
    'tools/**/*.{test,spec}.tsx',
  ]),
  {
    files: PROJECT_SERVICE_FILES,
    ignores: [
      'packages/**/*.{test,spec}.ts',
      'packages/**/*.{test,spec}.tsx',
      'apps/**/*.{test,spec}.ts',
      'apps/**/*.{test,spec}.tsx',
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ['tools/**/*.{ts,tsx}'],
    ignores: [
      'tools/**/*.{test,spec}.ts',
      'tools/**/*.{test,spec}.tsx',
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.rslint-tools.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: TYPESCRIPT_FILES,
    rules: {
      // The core rule does not model all TypeScript declaration semantics.
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
  {
    files: TYPESCRIPT_FILES,
    ignores: BIOME_RULE_IGNORES,
    rules: {
      // Rslint 0.9.3 can classify runtime const exports as type-only.
      '@typescript-eslint/consistent-type-exports': 'off',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/adjacent-overload-signatures': 'error',
      // Biome permits both T[] and Array<T> for non-simple element types;
      // Rslint's available modes require one spelling, so neither is equivalent.
      '@typescript-eslint/array-type': 'off',
      '@typescript-eslint/default-param-last': 'error',
      '@typescript-eslint/no-empty-function': 'error',
      '@typescript-eslint/no-empty-object-type': [
        'error',
        { allowInterfaces: 'with-single-extends' },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-extra-non-null-assertion': 'error',
      '@typescript-eslint/no-inferrable-types': 'error',
      '@typescript-eslint/no-invalid-void-type': 'error',
      '@typescript-eslint/no-misused-new': 'error',
      '@typescript-eslint/no-namespace': 'error',
      '@typescript-eslint/no-redeclare': 'error',
      '@typescript-eslint/no-this-alias': 'error',
      '@typescript-eslint/no-unnecessary-type-constraint': 'error',
      '@typescript-eslint/no-unsafe-declaration-merging': 'error',
      '@typescript-eslint/no-unused-expressions': [
        'error',
        { allowShortCircuit: true, allowTernary: true },
      ],
      '@typescript-eslint/no-unused-vars': 'error',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-use-before-define': 'off',
      '@typescript-eslint/no-useless-constructor': 'error',
      '@typescript-eslint/no-useless-empty-export': 'error',
      '@typescript-eslint/only-throw-error': 'error',
      '@typescript-eslint/prefer-as-const': 'error',
      '@typescript-eslint/prefer-enum-initializers': 'error',
      '@typescript-eslint/prefer-for-of': 'error',
      '@typescript-eslint/prefer-function-type': 'error',
      '@typescript-eslint/prefer-literal-enum-member': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/require-await': 'error',
      '@typescript-eslint/no-floating-promises': 'off',
      'no-console': ['error', { allow: ['warn', 'error', 'info'] }],
      'default-param-last': 'error',
      'no-empty': 'error',
      'no-empty-static-block': 'error',
      'no-use-before-define': 'off',
      'no-useless-constructor': 'off',
    },
  },
  {
    files: JAVASCRIPT_FILES,
    ignores: BIOME_RULE_IGNORES,
    // The native TypeScript optional-chain and for-of rules do not report on
    // JavaScript files; keep those Biome gaps explicit until Rslint supports them.
    rules: {
      'default-param-last': 'error',
      'no-throw-literal': 'error',
      'no-use-before-define': ['error', { functions: false, classes: false }],
      'no-useless-constructor': 'error',
      'require-await': 'error',
      'no-restricted-properties': [
        'error',
        {
          object: 'console',
          property: 'log',
          message: 'Use console.info instead.',
        },
      ],
    },
  },
  {
    files: ['**/*.{jsx,tsx}'],
    plugins: ['react'],
    rules: {
      'react/jsx-key': 'warn',
      'react/jsx-no-duplicate-props': 'error',
      'react/no-children-prop': 'error',
      'react/jsx-fragments': 'error',
      'react/jsx-no-useless-fragment': 'error',
    },
  },
  {
    files: ['**/*.{jsx,tsx}'],
    ...reactHooksPlugin.configs.recommended,
    rules: {
      ...reactHooksPlugin.configs.recommended.rules,
      // Rslint reports 61 existing hooks while Biome reports only the one
      // intentionally suppressed dynamic dependency list.
      'react-hooks/exhaustive-deps': 'off',
    },
  },
  {
    files: [
      'apps/**/*.{js,mjs,cjs,jsx,ts,tsx}',
      'luna/examples/**/*.{js,mjs,cjs,jsx,ts,tsx}',
    ],
    rules: {
      'no-console': 'off',
      'no-restricted-properties': 'off',
    },
  },
  {
    files: [
      'luna/examples/luna-design-system/src/**/*.{js,mjs,cjs,jsx,ts,tsx}',
      'luna/examples/luna-showcase-studio/src/**/*.{js,mjs,cjs,jsx,ts,tsx}',
      'luna/examples/luna-stage-basic/src/**/*.{js,mjs,cjs,jsx,ts,tsx}',
      'luna/examples/luna-stage-motion/src/**/*.{js,mjs,cjs,jsx,ts,tsx}',
    ],
    languageOptions: { globals: globals.browser },
    rules: { 'node/no-unsupported-features/node-builtins': 'off' },
  },
  {
    files: ['**/*.{test,spec}.ts', '**/*.{test,spec}.tsx'],
    plugins: { vitest },
    rules: { ...vitest.configs.recommended.rules },
    languageOptions: { globals: { ...vitest.environments.env.globals } },
  },
  {
    files: ['**/*.cjs'],
    languageOptions: {
      globals: { ...globals.node, ...globals.es2021 },
      sourceType: 'commonjs',
    },
    rules: { 'import-js/no-commonjs': 'off' },
  },
])
