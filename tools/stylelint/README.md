# stylelint tools

This directory contains custom stylelint tooling used by `lynx-ui-open-source`.

## `luna-known-css-vars.mjs`

Custom stylelint rule: `lynx-ui/luna-known-css-vars`

### Purpose

This rule prevents example and package styles from referencing unknown CSS custom properties.
It is mainly used to catch invalid LUNA token usage early, especially in demo CSS written by AI or during quick iteration.

### What the rule validates

The rule collects allowed CSS variables from these sources:

1. The configured `tokensFile`
2. Any configured `extraTokenFiles`
3. The current CSS file
4. Relative `@import` chains reachable from those files

If a declaration uses `var(--some-token)` and `--some-token` is not found in the allowed set, stylelint reports an error.

### Current repository usage

The repository registers this rule in `stylelint.config.cjs` and runs it through:

```bash
pnpm check:luna-vars
```

This check is also wired into staged CSS formatting and CI.

### Configuration

Example:

```js
rules: {
  'lynx-ui/luna-known-css-vars': [true, {
    tokensFile: './luna/packages/luna-styles/dist/index.css',
    extraTokenFiles: [
      './apps/examples/Popover/shared/base.css',
      './apps/examples/Sheet/shared/base.css',
    ],
  }],
}
```

#### `tokensFile`

- Main source of truth for shared theme variables
- Must exist before the rule runs
- If missing, the rule reports an error and stops

#### `extraTokenFiles`

- Optional list of additional CSS files that declare shared local variables
- Useful for example-specific shared bases such as `shared/base.css`
- Each file must exist, otherwise the rule reports an error

### Notes

- Only relative `@import` paths are followed by the rule
- Non-relative imports are ignored during recursive variable collection
- Locally declared CSS variables are always allowed in the file where they are defined

### When to update this README

Update this file when any of the following changes:

- The rule name
- The allowed variable source model
- The expected configuration shape
- The command or workflow integration
