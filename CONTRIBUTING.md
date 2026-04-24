# Contributing to lynx-ui

Thank you for your interest in contributing to lynx-ui!

## Prerequisites

- **Node.js**: >= 18
- **pnpm**: >= 9

  > You can enable pnpm using corepack: `corepack enable`

## Repository Structure

This repository includes the shared theming foundation in-repo.

- **`luna/`**
  Contains L.U.N.A (tokens, theming, styles, Tailwind preset, ReactLynx bindings, etc.)

## Setup Guide

1. **Clone the repository:**

   ```bash
   git clone https://github.com/lynx-family/lynx-ui.git
   cd lynx-ui
   ```

2. **Install dependencies:**

   ```bash
   pnpm install
   ```

3. **Build the project:**

   ```bash
   pnpm build
   ```

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
   npx turbo watch dev --filter '@lynx-example/lynx-ui-button'
   ```

#### Publishing Examples to the Website

Each component's example code is maintained in this repository and published as a standalone npm package
named `@lynx-example/lynx-ui-<component-name>`:

- Example packages are released together with the component, and every release **requires a changeset**.
- After a release, the corresponding example version in the
  [lynx-website](https://github.com/lynx-family/lynx-website) repository must be **updated manually**.

The lynx-website site uses the `GO` component to render example code. The associated content lives at:

```
sharedDocs/introDocs/lynx-ui-<component-name>/Introduction.mdx
```

> **Note**: Make sure the stable version of `@lynx-example/lynx-ui-<component-name>` has been published
> **before** updating the example code and related docs in the lynx-website repository, to avoid
> referencing a version that does not yet exist on the registry.

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

Publishing docs for a newly developed component is part of the component's delivery process.

The lynx-ui website is served at [lynxjs.org/lynx-ui](https://lynxjs.org/lynx-ui/), with its source code
hosted in the [lynx-website](https://github.com/lynx-family/lynx-website) repository. This repository
(lynx-ui) only maintains **per-component documentation fragments**; the full website content is
organized and updated in lynx-website.

### Component README

The top-level component description lives in:

```
packages/<component-name>/README.md
```

### Generated Docs

In addition to the hand-written `README.md`, each component ships a `docs/` directory that is consumed
by the website:

```
packages
└── lynx-ui-<component-name>
    ├── README.md                 # Component description (hand-written, source of truth)
    └── docs
        ├── README.mdx            # English docs
        ├── README.zh.mdx         # Chinese docs
        └── APIReference.mdx      # API reference
```

How each file is maintained:

- **`README.mdx` / `README.zh.mdx`**: English / Chinese component docs. The description sections are
  generated from `README.md` and `README.zh.md` respectively, so **you should not hand-edit the
  description paragraphs inside the mdx files**.
- **`APIReference.mdx`**: API reference generated from `src/types/index.d.ts`. After changing type
  definitions, regenerate the reference from the repository root:

  ```bash
  # Generate all docs
  pnpm genDoc

  # Generate docs for specific components
  pnpm genDoc lynx-ui-dialog lynx-ui-button
  ```

### Syncing with lynx-website

The lynx-website build depends on the **latest `main` branch** of this repository, so:

- Documentation updates are automatically synced to lynx-website **after the change is merged into
  `main`**.
- Every time lynx-website runs `pnpm install`, it pulls the component docs into its
  `sharedDocs/packageDocs` directory and extracts component descriptions from `README.md` /
  `README.zh.md`. **No manual intervention is required.**

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

### Versioning

- **Snapshot Versions**
  After a PR is merged, CI will automatically publish a snapshot (canary) version
  (e.g. `@lynx-js/lynx-ui-button-canary`) for testing and verification.

## License

By contributing to lynx-ui, you agree that your contributions will be licensed under the
[Apache-2.0 License](./LICENSE).
