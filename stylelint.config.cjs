const path = require('node:path')

module.exports = {
  ignoreFiles: [
    '**/dist/**',
    '**/node_modules/**',
  ],
  overrides: [
    {
      files: ['packages/lynx-ui-*/src/**/*.css'],
      rules: {
        'selector-class-pattern': [
          '^lynx-ui-[a-z0-9-]+(?:__(?:[a-z0-9]+(?:-[a-z0-9]+)*)(?:--(?:[a-z0-9]+(?:-[a-z0-9]+)*))?)?$',
          {
            message:
              'Component classes must use the `lynx-ui-<package>__<lowercase-kebab-name>` namespace.',
            resolveNestedSelectors: true,
          },
        ],
      },
    },
  ],
  plugins: [
    path.resolve(__dirname, './tools/stylelint/luna-known-css-vars.mjs'),
  ],
  rules: {
    'lynx-ui/luna-known-css-vars': [true, {
      extraTokenFiles: [
        './apps/examples/InputOTP/shared/base.css',
        './apps/examples/Popover/shared/base.css',
        './apps/examples/Sheet/shared/base.css',
      ],
      tokensFile: './luna/packages/luna-styles/dist/index.css',
    }],
  },
}
