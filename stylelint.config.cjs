const path = require('node:path')

module.exports = {
  ignoreFiles: [
    '**/dist/**',
    '**/node_modules/**',
  ],
  plugins: [
    path.resolve(__dirname, './tools/stylelint/luna-known-css-vars.mjs'),
  ],
  rules: {
    'lynx-ui/luna-known-css-vars': [true, {
      extraTokenFiles: [
        './apps/examples/Popover/shared/base.css',
        './apps/examples/Sheet/shared/base.css',
      ],
      tokensFile: './luna/packages/luna-styles/dist/index.css',
    }],
  },
}
