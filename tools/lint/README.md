# Lint infrastructure

`rslint.config.mjs` creates the repository configuration with
`createLintConfig()` from `tools/lint/config.mjs`. The shared factory keeps native
rule registration and compatibility plugins in one place. Callers can supply
their repository root, React package, import grouping, additional ignored paths,
syntax-rule exclusions, copyright year, and an optional common typed project.

Interfaces and type aliases use PascalCase in all authored TypeScript files,
including documentation sources, tests, and tooling. The native
`@typescript-eslint/naming-convention` rule permits acronyms such as `UI` and
`OTP`; it does not constrain hook names, properties, or generic parameters.
Hook functions keep names such as `useExample`; associated types still use
PascalCase, such as `UseExampleOptions` and `UseExampleReturn`.
The public type surface is the set of types re-exported through each package's
public index entry point (`src/index.tsx` or `src/index.ts`), including transitive
re-exports. Types used only within the repository may be renamed even if their
implementation module exports them.
Preserve deprecated public lowercase aliases with an explanatory rule suppression
on each declaration rather than exempting a file or name pattern.

Typed source scopes are configurable with `sourceFiles` and `sourceIgnores`;
tooling scopes use `toolingFiles` and `toolingIgnores`. The same scopes select
the type-checked presets and their parser projects. `testFiles` selects files
that need the explicit lint project without the type-checked presets. When
changing layouts, configure the matching source/tooling test exclusions and
include those files in the caller's lint project. For example:

```js
createLintConfig({
  rootDir: import.meta.dirname,
  project: './tools/lint/tsconfig.json',
  sourceFiles: ['services/**/*.{ts,tsx}'],
  sourceIgnores: ['services/**/*.{test,spec}.{ts,tsx}'],
  toolingFiles: ['scripts/**/*.{ts,tsx}'],
  toolingIgnores: ['scripts/**/*.{test,spec}.{ts,tsx}'],
  testFiles: ['**/*.{test,spec}.{ts,tsx}', 'checks/**/*.{ts,tsx}'],
})
```

`tools/lint/tsconfig.json` supplies type information for JavaScript, tests, and
tooling TypeScript that package build projects exclude. It extends the root
compiler configuration and `tools/lint/tsconfig.base.json` for the common
lint-only compiler options. Package and app source files use their existing
projects through the project service. Callers can override the explicit lint
project path with the factory's `project` option.

Pass the lint project directly to Rslint rather than using a solution config
containing only project references: in Rslint 0.9.5, the latter skips the
type-aware JavaScript optional-chain rule. Build project references remain in
the root compiler configuration.

`tools/lint/json.mjs` exports `createJSONConfig()` and `runJSONLint()`.
`tools/scripts/lint-json.mjs` calls the shared runner. JSON/JSONC/JSON5 parsing and
spelling use ESLint's API; no command calls ESLint's CLI.

`tools/lint/check-changed.mjs` checks or fixes changed files while preserving
filename boundaries. Its defaults compare with `main` and fix changed files.
The CLI resolves paths from the Git repository root, including when invoked
from a subdirectory. `--check` performs read-only checks, as does
`pnpm check:changed`; `pnpm fix:changed` retains autofix mode.
Callers can select another `--base`, include
untracked files with `--include-untracked`, and exclude a subtree with
`--ignore-prefix`. Formatting is restricted to the selected files. The existing
shell script delegates to this shared command.
Prefixes match an exact path or its descendants; `packages/foo` and
`packages/foo/` both preserve sibling paths such as `packages/foobar`.

Validate configuration changes with valid and invalid rule probes. Supply
`rootDir` when calling the factories from another repository so spelling,
import resolution, and typed projects resolve against that caller's workspace.
Run `node --test tools/lint/*.test.mjs` for the shared tooling regression checks.
