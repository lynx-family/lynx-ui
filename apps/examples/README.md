# Lynx UI Examples

This directory (`apps/examples`) contains example applications for `lynx-ui` components. Each component's examples are contained within its own package in `apps/examples/src`.

## Directory Structure

```
apps/examples
├── Button # Example package for Button
├── Checkbox # Example package for Checkbox
├── ...
└── Switch
```

## Running Examples

We use `turbo` to run examples for specific components.

### 1. Identify the Package Name

First, find the package name for the component you want to run. You can check the `package.json` inside the component's example folder (`apps/examples/src/<Component>/package.json`).

Common pattern: `lynx-ui-<component-name>-examples`

**Examples:**

- Button: `lynx-ui-button-examples`
- Checkbox: `lynx-ui-checkbox-examples`

### 2. Run with Turbo

Run the development server for the specific example package using the following command from the root of the repository:

```bash
npx turbo watch dev --filter <package-name>
```

**Note:** We use `watch dev` to ensure that changes in dependencies (e.g., `packages/lynx-ui-button`) are watched and rebuilt automatically.

**Example:**

To run the **Button** examples:

```bash
npx turbo watch dev --filter lynx-ui-button-examples
```

## Troubleshooting

- **Package not found**: Ensure you are using the correct package name from the `package.json` file, not just the directory name.
- **Turbo errors**: Make sure you have installed dependencies in the root directory using `pnpm install`.
