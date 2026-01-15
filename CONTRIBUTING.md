# Contributing to Lynx UI

Thank you for your interest in contributing to Lynx UI!

## Prerequisites

- **Node.js**: >= 18
- **pnpm**: >= 9

  > You can enable pnpm using corepack: `corepack enable`

## Repository Structure

This repository uses a **Git submodule** to include the shared theming foundation.

- **`lunarium/`**
  A Git submodule that contains L.U.N.A (tokens, theming, styles, Tailwind preset, React bindings, etc.)

Most Lynx UI examples depend on code inside `lunarium`, so the submodule **must be initialized before development**.

## Setup Guide

1. **Clone the repository (with submodules):**

   ```bash
   git clone --recurse-submodules https://github.com/lynx-family/lynx-ui.git
   cd lynx-ui
   ```

   If you already cloned the repo without submodules:

   ```bash
   pnpm update:submodules
   ```

2. **Install dependencies:**

   ```bash
   pnpm install
   ```

3. **Build the project:**

   ```bash
   pnpm build
   ```

> If you encounter missing packages under `lunarium/`,
> make sure the submodule is initialized.

## Development Workflow

### Component Development

Each component is located in `packages/<component-name>` and typically follows this structure:

- `src`: Component source code
- `types`: Type definitions (`index.d.ts`, `index.docs.d.ts`)
- `README.md`: Component documentation

#### Creating a New Component

To scaffold a new component with the correct structure and configuration, run:

```bash
pnpm make-new-component --create <component-name>
# Example: pnpm make-new-component --create toast
```

This will create a new package in:

```
packages/lynx-ui-<component-name>
```

### Running Examples

To visualize and test your changes, you should run the component examples.
Verify the specific example package name in:

```
apps/examples/src/<Component>/package.json
```

1. **Create example files:**

   ```bash
   pnpm makeNewComponent --example <component-name>
   # Example: pnpm makeNewComponent --example toast
   ```

2. **Run the example:**
   For detailed instructions on how to find the package name and run specific examples, please refer to
   [apps/examples/README.md](apps/examples/README.md).

   ```bash
   # Example: Run button examples
   npx turbo watch dev --filter lynx-ui-button-examples
   ```

## Code Quality

- **Linting & Formatting**

  ```bash
  pnpm check
  pnpm fix:all
  ```

- **Check Changed Files**

  ```bash
  # Check only changed files
  pnpm check:changed

  # Check changed files with auto-fix (use with care)
  pnpm check:changed:unsafe
  ```

- **Testing**

  ```bash
  pnpm test
  ```

## Documentation

Component documentation lives in:

```
packages/<component-name>/README.md
```

To generate documentation:

```bash
# Generate all docs
pnpm genDoc

# Generate docs for specific components
pnpm genDoc lynx-ui-dialog lynx-ui-button
```

## Pull Request Guidelines

### Commits & Merge Strategy

- **One Commit per PR (after merge)**
  Pull Requests are expected to be **squash-merged** into the main branch.

  - You may use multiple commits during development.
  - The final merged PR **must result in a single commit** on the target branch.

- **Conventional Commits**
  Please follow the [Conventional Commits](https://www.conventionalcommits.org/) specification
  for commit messages (the final squashed commit).

- **Changesets**
  We use Changesets for versioning.
  Please add a changeset for any user-facing change:

  ```bash
  pnpm changeset
  ```

- **Submodule Pointer Updates**\
  Changes to Git submodule pointers (e.g. `lunarium`) are treated as
  infrastructure-level changes and must be handled separately from
  regular component work.

  - Do not update submodule pointers in regular component PRs.
  - Changes to submodules should be made in the corresponding submodule
    repositories first.
  - Submodule pointer updates must be submitted as a dedicated PR
    with clear intent.

### Versioning

- **Snapshot Versions**
  After a PR is merged, CI will automatically publish a snapshot (canary) version
  (e.g. `@lynx-js/lynx-ui-button-canary`) for testing and verification.

## License

By contributing to Lynx UI, you agree that your contributions will be licensed under the
[Apache-2.0 License](./LICENSE).
