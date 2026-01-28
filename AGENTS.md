# lynx-ui Agent Guidelines

This document provides context, conventions, and guidelines for AI agents working on the **lynx-ui** repository.

> **CRITICAL NAMING CONVENTION**: The name of this repository and project is **lynx-ui** (lowercase). **NEVER** use "Lynx UI", "Lynx-UI", or any other variation in documentation, comments, or output.

## Project Overview

**lynx-ui** is a UI component library for Lynx, built as a Monorepo using TurboRepo.

- **Framework**: React (Lynx bindings)
- **Language**: TypeScript
- **Package Manager**: pnpm
- **Build System**: TurboRepo, Rslib

## Directory Structure

This repository follows a standard Monorepo structure. Understanding this is crucial for navigating and creating files correctly.

- **`packages/`**: The core of the library. Each UI component resides in its own package here.
  - Structure: `packages/lynx-ui-<component>/`
  - Key files per package:
    - `src/`: Source code (usually `index.tsx` and component files).
    - `package.json`: Dependency management.
    - `README.md`: Documentation.
  - Example: `packages/lynx-ui-button/` contains the Button component.

- **`apps/examples/`**: Contains runnable examples for development and testing.
  - Structure: `apps/examples/<Component>/<UseCase>/`
  - Key files per example:
    - `index.tsx`: The entry point for the example.
    - `index.css`: Styles for the example.
  - Example: `apps/examples/Button/Basic/` contains a basic usage example of the Button.

- **`lunarium/`**: A Git submodule containing shared design tokens, themes, and base styles (L.U.N.A).
  - **Note**: This is an external dependency managed as a submodule. Do not modify files here directly unless you know what you are doing.

## Development Workflow

### 1. Initial Setup

**ALWAYS** ensure dependencies are up to date and submodules are initialized.

```bash
# Install dependencies and submodules
pnpm install:all
```

### 2. Creating a New Component

**NEVER** manually create a component directory. Always use the provided script to scaffold a new component to ensure correct structure and configuration.

```bash
pnpm make-new-component --create <component-name>
# Example: pnpm make-new-component --create toast
```

### 3. Running Examples

To test changes, run the specific example for the component.

1. **Create example (if missing)**:

   ```bash
   pnpm make-new-component --example <component-name>
   ```

2. **Run the dev server**:
   Check `apps/examples/README.md` or `package.json` in the example folder for the exact filter name. Typically:

   ```bash
   npx turbo watch dev --filter lynx-ui-<component-name>-examples
   ```

### 4. Build & Verify

Before submitting changes, ensure the project builds and passes checks.

```bash
# Build all packages
pnpm build

# Run all checks (format, lint, manypkg, sherif, submodule regression)
pnpm check:all
```

**Additional Verification Tools**:

- **`pnpm check:manypkg`**: Checks for dependency mismatches in the monorepo.
- **`pnpm check:sherif`**: Lints `package.json` files for potential issues using Sherif.
- **`pnpm check:submodule`**: Prevents submodule regression (ensures submodules don't point to older commits).
- **`pnpm spell`**: Runs CSpell to check for spelling errors.

## Coding Standards

### Headless UI Principles

This library follows the **Headless** pattern, focusing on logic, state management, and accessibility while remaining unstyled by default.

- **Separation of Concerns**: Components provide the logic (state, event handling) but minimal styling.
- **Composition**: Use sub-components (e.g., `Checkbox` + `CheckboxIndicator`) to allow flexible layout and styling.
- **State via Context**: Share state between parent and child components using React Context (e.g., `CheckboxContext`).
- **Render Props / Children**: Support `children` as a function (render props) or standard children to pass state down for dynamic styling.
- **Styling API**: Provide `className` and `style` props on all components to allow users to apply their own design system (or `lunarium` tokens).
- **State-based Class Names**: Components should not apply default class names, but users can use `className` props to apply state-based class names.

### General

- **TypeScript**: Use strict typing. Avoid `any`.
- **Functional Components**: Use React Functional Components with Hooks.
- **File Headers**: All source files must include the copyright header (checked by ESLint):

  ```typescript
  // Copyright 2026 The Lynx Authors. All rights reserved.
  // Licensed under the Apache License Version 2.0 that can be found in the
  // LICENSE file in the root directory of this source tree.
  ```

### Styling

- Use `clsx` for conditional class names.
- Follow the existing pattern of separating styles into `.css` files or using Tailwind if configured in the specific package.
- Respect the `lunarium` design tokens.

### Main Thread Script (MTS)

Main Thread Script allows executing JavaScript on the main thread. It is often used for gesture handling and animations to achieve native-like performance by avoiding communication overhead between threads.

- **Usage**:
  - Use `'main thread'` directive at the beginning of the function.
  - Use `main-thread:` prefix for event handlers (e.g., `main-thread:bindtap`).
  - Use `runOnMainThread` to invoke MTS functions from the background thread.
  - Use `runOnBackground` to call background functions from MTS.

  ```typescript
  // Example: Handling a tap on the main thread
  <view
    main-thread:bindtap={(event) => {
      'main thread'
      console.log('Tapped on main thread', event)
      // Perform animations or state updates on main thread
    }}
  />
  ```

### Linting & Formatting

This project uses **Biome** for linting and formatting, and **dprint** for Markdown formatting.

- Run checks: `pnpm check`
- Fix issues: `pnpm fix:all`

### Documentation & Markdown

- **Markdown Lint**: Ensure all `.md` and `.mdx` files adhere to standard Markdown linting rules.
  - Use correct heading hierarchy (h1 -> h2 -> h3).
  - Ensure blank lines around block elements (lists, code blocks, etc.).
  - No trailing spaces.
  - Use valid relative links for internal references.
  - **Unordered list indentation**: Use 2 spaces for indentation (MD007).
- **Formatting**: Markdown files are formatted using `dprint`. Run `pnpm format` (or `pnpm fix:all`) to format.

### Testing

- Use **Vitest** for unit testing.
- Test files should be located alongside source files or in a `__tests__` directory (follow existing pattern).
- Run tests: `pnpm test`

## Contribution Rules

1. **Changesets**: All changes that affect package versions must include a changeset (`pnpm changeset`).
2. **Submodules**: Ensure `lunarium` submodule is initialized (`pnpm update:submodules`).

## Documentation Maintenance

Documentation should be treated as code. While AI can draft updates, humans must verify them to ensure strategic alignment.

1. **Event-Driven Updates**: Update `AGENTS.md` immediately when:
   - A new architectural pattern is adopted.
   - A build tool or workflow changes.
   - A recurring bug is found that could be prevented by better context.
2. **Component Skills (`SKILL.md`)**:
   - **Drafting**: Ask AI to summarize the component's usage and pitfalls after implementation.
   - **Refining**: Humans must review the "Prompt Formula" to ensure it aligns with the team's mental model.
3. **Code Review**:
   - Documentation changes must be included in the same Pull Request as the code changes.
   - Reviewers should verify that `AGENTS.md` and `SKILL.md` accurately reflect the code changes.

## Automation & Tooling

To streamline maintenance, leverage GitHub's native features:

1. **Review Suggestions**: For small documentation fixes within the PR diff, use [Suggested Changes](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/reviewing-changes-in-pull-requests/incorporating-feedback-in-your-pull-request) to allow one-click commits.
2. **Label-Triggered Updates**: Consider setting up a GitHub Action that listens for a specific label (e.g., `bot:update-docs`). When applied, the Action runs scripts to analyze the codebase and push updates to `AGENTS.md` automatically.
3. **AI Code Review**: Configure tools like **CodeRabbit** to specifically check for `AGENTS.md` compliance. Add custom instructions to the AI bot to flag missing documentation updates.
