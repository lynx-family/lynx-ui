# lynx-ui Agent Guidelines

This document provides context, conventions, and guidelines for AI agents working on the **lynx-ui** repository.

> **CRITICAL NAMING CONVENTION**: The name of this repository and project is **lynx-ui** (lowercase). **NEVER** use "Lynx UI", "Lynx-UI", or any other variation in documentation, comments, or output.

## Project Overview

**lynx-ui** is a UI component library for ReactLynx, built as a Monorepo using TurboRepo.

- **Framework**: React (Lynx bindings)
- **Language**: TypeScript
- **Runtime**: Node.js 24
- **Package Manager**: pnpm 10.33.2
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

- **`luna/`**: The in-repo theming foundation (L.U.N.A) used by lynx-ui (tokens, styles, Tailwind preset, ReactLynx bindings).

## Development Workflow

### 1. Initial Setup

**ALWAYS** ensure dependencies are up to date.
Use Node.js 24 and pnpm 10.33.2, matching `.nvmrc`, `package.json`, and CI. Prefer Corepack so the pinned pnpm version from `packageManager` is used.

```bash
# Enable the package manager pinned by package.json
corepack enable

# Install dependencies
pnpm install
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
   npx turbo watch dev --filter '@lynx-example/lynx-ui-<component-name>'
   ```

Examples should prefer importing public APIs from `@lynx-js/lynx-ui` instead of `@lynx-js/lynx-ui-<component>` or `@lynx-js/lynx-ui-common`, unless a symbol is intentionally excluded from the aggregate entry.

When adding a new example under `apps/examples/<Component>/<UseCase>/`, ALWAYS register it in that component's sibling `lynx.config.mjs`. If the entry is missing, the example will not appear in the example app.

### 3.1 Example Theming With LUNA

Examples should use the in-repo LUNA theme foundation by default instead of ad-hoc hard-coded colors.

- Import `@lynx-js/luna-styles/index.css` in example styles so CSS variables are available.
- Apply a theme class at the example root. Available themes are `lunaris-dark`, `lunaris-light`, `luna-dark`, and `luna-light`.
- Prefer `lunaris-dark` as the default demo theme unless the example is specifically trying to show a neutral product-style surface, in which case `luna-dark` or `luna-light` is a better fit.
- Prefer semantic LUNA tokens over literal color values.
- When you need the exact token names or meanings, look them up in the in-repo `luna/` workspace and the imported LUNA styles source used by the example.
- Use token semantics rather than visual guesses. Choose surface, content, accent, backdrop, divider, or gradient roles based on purpose, then resolve the exact token from the source of truth in `luna/`.
- When an example needs RTL support, set `direction: rtl` on the outer container and let descendants inherit it through CSS instead of duplicating directional styles on every node.

### 4. Build & Verify

Before submitting changes, ensure the project builds and passes checks.
**CRITICAL**: You MUST run `pnpm turbo build` to perform a full workspace build and ensure no compilation errors are introduced.

```bash
# Build all packages
pnpm run build

# Verify the aggregate lynx-ui entry re-exports the expected package surface
pnpm check:exports

# Run all checks (format, lint, manypkg, sherif)
pnpm check:all
```

**Additional Verification Tools**:

- **`pnpm check:manypkg`**: Checks for dependency mismatches in the monorepo.
- **`pnpm check:sherif`**: Lints `package.json` files for potential issues using Sherif.
- **`pnpm check:exports`**: Verifies that `@lynx-js/lynx-ui` re-exports the expected public surface from included sub-packages.
- **`pnpm spell`**: Runs CSpell to check for spelling errors.

## Coding Standards

### Headless UI Principles

This library follows the **Headless** pattern, focusing on logic, state management, and accessibility while remaining unstyled by default.

- **Separation of Concerns**: Components provide the logic (state, event handling) but minimal styling.
- **Composition**: Use sub-components (e.g., `Checkbox` + `CheckboxIndicator`) to allow flexible layout and styling.
- **State via Context**: Share state between parent and child components using React Context (e.g., `CheckboxContext`).
- **Render Props / Children**: Support `children` as a function (render props) or standard children to pass state down for dynamic styling.
- **Styling API**: Provide `className` and `style` props on all components to allow users to apply their own design system (or L.U.N.A tokens).
- **State-based Class Names**: Components should not apply default class names, but users can use `className` props to apply state-based class names.

### General

- **TypeScript**: Use strict typing. Avoid `any`.
- **Comments**: All code comments **MUST** be written in English.
- **Functional Components**: Use React Functional Components with Hooks.
- **Controlled & Uncontrolled Modes**: We encourage all interactive components to support both **controlled** and **uncontrolled** modes. This provides flexibility for users who want to manage state externally (controlled) or let the component manage its own internal state (uncontrolled). Typically, you should provide a `value` (or `show`, etc.) prop for the controlled mode, and a `defaultValue` (or `defaultShow`, etc.) prop for the uncontrolled mode.
  - **Example**:
    ```tsx
    // Popover.tsx
    function PopoverRoot(props) {
      const { show, defaultShow = false, onVisibleChange, children } = props

      // Determine mode
      const isControlled = show !== undefined

      // Internal state for uncontrolled mode
      const [uncontrolledShow, setUncontrolledShow] = useState(defaultShow)

      // The actual value used for rendering
      const actualShow = isControlled ? show : uncontrolledShow

      // Internal handler to trigger state updates
      const handleVisibleChange = (visible: boolean) => {
        if (isControlled) {
          onVisibleChange?.(visible)
        } else {
          setUncontrolledShow(visible)
        }
      }

      // Pass `actualShow` and `handleVisibleChange` to children via Context...
    }
    ```
- **Explicit Props Spreading**: We DO NOT recommend components blindly spreading all raw props (`...rest`) to the underlying view. Instead, use a dedicated prop (e.g., `buttonProps`, `wrapperProps`) to pass raw element properties. This prevents unexpected behavior, avoids polluting the component API surface, and explicitly declares intent.
  - **Bad**:
    ```tsx
    // App.tsx
    <Button style={...} className={...} onTap={...} force-can-scroll={true} />

    // Button.tsx
    function Button(props) {
       const { style, className, onTap, ...rest } = props
       return (
         <view style={style} className={className} onTap={onTap} {...rest} />
       )
    }
    ```
  - **Good**:
    ```tsx
    // App.tsx
    <Button style={...} className={...} onTap={...} buttonProps={{ 'force-can-scroll': true }} />

    // Button.tsx
    function Button(props) {
       const { style, className, onTap, buttonProps } = props
       return (
         <view style={style} className={className} onTap={onTap} {...buttonProps} />
       )
    }
    ```
- **File Headers**: All source files must include the copyright header (checked by ESLint):

  ```typescript
  // Copyright 2026 The Lynx Authors. All rights reserved.
  // Licensed under the Apache License Version 2.0 that can be found in the
  // LICENSE file in the root directory of this source tree.
  ```

### Styling

- Use `clsx` for conditional class names.
- Follow the existing pattern of separating styles into `.css` files or using Tailwind if configured in the specific package.
- Respect the L.U.N.A design tokens.

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
2. **Toolchain Updates**: Keep `.nvmrc`, `package.json` `engines`/`packageManager`, `pnpm-lock.yaml`, and GitHub Actions `actions/setup-node` versions aligned when changing Node.js or pnpm.
3. **Pull Request Titles**: Pull request titles **MUST** use a Conventional Commits style prefix that starts the title, such as `fix(swiper): preserve release velocity on Android`.
   Do not prepend labels like `[codex]` before the release type, because the semantic PR check parses the type from the beginning of the title.
   Use one of the repository's allowed types, such as `fix`, `feat`, `docs`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`, `release`, or `security`.

## Documentation Maintenance

Documentation should be treated as code. While AI can draft updates, humans must verify them to ensure strategic alignment.

1. **Event-Driven Updates**: Update `AGENTS.md` immediately when:
   - A new architectural pattern is adopted.
   - A build tool or workflow changes.
   - A recurring bug is found that could be prevented by better context.
2. **Component Skills (`SKILL.md`)**:
   - **Drafting**: Ask AI to summarize the component's usage and pitfalls after implementation.
   - **Refining**: Humans must review the "Prompt Formula" to ensure it aligns with the team's mental model.
3. **Scope of `AGENTS.md`**:
   - Keep `AGENTS.md` focused on repository workflow, build, verification, and contribution guidance.
   - Do not add component-specific usage, prop documentation, examples, or design guidance to `AGENTS.md`; put that information in the component README, typedoc comments, examples, or component `SKILL.md`.
4. **Package README Scope**:
   - Keep package `README.md` files high-level. They should describe purpose, installation, component structure, and point readers to examples or API docs.
   - Do not turn package READMEs into step-by-step usage manuals by appending narrow usage rules or behavioral footnotes for every change.
   - Put detailed behavior guidance, caveats, and prompt-oriented instructions in typed API docs, examples, component `SKILL.md`, or `AGENTS.md` when that context is the better fit.
5. **Code Review**:
   - Documentation changes must be included in the same Pull Request as the code changes.
   - Reviewers should verify that `AGENTS.md` and `SKILL.md` accurately reflect the code changes.

## Automation & Tooling

1. **Review Suggestions**: For small documentation fixes within the PR diff, use [Suggested Changes](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/reviewing-changes-in-pull-requests/incorporating-feedback-in-your-pull-request) to allow one-click commits.
2. **Label-Triggered Updates**: Consider setting up a GitHub Action that listens for a specific label (e.g., `bot:update-docs`). When applied, the Action runs scripts to analyze the codebase and push updates to `AGENTS.md` automatically.
3. **AI Code Review**: Configure tools like **CodeRabbit** to specifically check for `AGENTS.md` compliance. Add custom instructions to the AI bot to flag missing documentation updates.
