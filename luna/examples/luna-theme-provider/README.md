# LUNA Theme Provider Example

This example demonstrates LUNA theming in ReactLynx.

It includes two entries:

- `LunaThemeShell`: applies CSS variables from `@lynx-js/luna-styles` with
  `LunaTheme`.
- `LunaThemeProvider`: resolves token data from `@lynx-js/luna-tokens` with
  `LunaThemeProvider` and color hooks.

The QR code schema appends `luna_theme` as a query parameter, which Lynx passes
through `globalProps` so the example can switch the active theme variant.

## Development

Run the development server from the repository root:

```bash
pnpm --filter @lynx-example/luna-theme-provider dev
```

Build the example:

```bash
pnpm --filter @lynx-example/luna-theme-provider build
```
