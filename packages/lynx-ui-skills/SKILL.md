---
name: lynx-ui-skills
description: Use when the user is building with lynx-ui and needs help selecting components, checking supported props or exports, adapting public examples, or solving usage problems using the curated lynx-ui component references bundled with this skill.
---

# lynx-ui Skills

Use this skill to answer practical lynx-ui component questions with the bundled public references in this package.

This is not a generic documentation dump. Treat it as a routing and implementation aid for real tasks such as:

- choosing the right lynx-ui component for a feature
- implementing a component correctly
- checking whether a prop, ref method, or export is public
- adapting an example to a user’s use case
- debugging a usage issue against the documented component surface

## Workflow

1. Identify the concrete component or small set of candidate components.
   - If the user already names a component, start there.
   - If the user describes behavior but not the component, use `reference.md` as the routing guide.
2. Read `references/components/<component>/guide.md` first.
   - Use it for usage patterns, composition guidance, and common pitfalls.
   - Do not open every file by default.
3. Read `references/components/<component>/api.md` only when you need exact public surface details.
   - Use it to verify prop names, ref methods, exported types, and other public interfaces.
   - Prefer verification over memory; do not invent unsupported APIs.
4. Read `references/components/<component>/examples.md` when you need a concise implementation pattern.
   - Use `examples/<Component>/<Case>/index.tsx` only when the aggregated example summary is not enough and the raw entry file matters.
5. If the task spans multiple components, repeat the same progressive-disclosure flow for each component instead of loading everything up front.

## Decision Rules

- Prefer the smallest relevant set of references.
- Use `reference.md` for component selection, not as detailed usage documentation.
- Treat `guide.md` as the primary source for how to use the component.
- Treat `api.md` as the source of truth for what the public component surface exposes.
- Treat examples as implementation patterns, not proof that undocumented APIs are public.
- If a requested behavior is not covered by the bundled component references, say that explicitly instead of inferring unsupported behavior.
- If the component is not included in this skill, state the coverage limit and fall back to the repository sources rather than pretending the skill covers it.

## Answering Rules

- Give direct guidance tied to the user’s task, not a tour of the package structure.
- When useful, cite the exact reference file you relied on.
- Recommend imports from `@lynx-js/lynx-ui` by default unless the symbol is intentionally excluded from the aggregate entry.
- Preserve lynx-ui’s headless model: emphasize composition, state, and public APIs rather than assuming built-in styles.
- When adapting an example, keep only the relevant pattern and remove unrelated demo code.

## Reference Map

- `reference.md`
  Use first when you need to choose the right component.
- `references/components/<component>/guide.md`
  Use first for component selection, usage, and pitfalls.
- `references/index.md`
  Use to see the currently bundled component coverage.
- `references/components/<component>/api.md`
  Use for exact public API verification.
- `references/components/<component>/examples.md`
  Use for concise example patterns.
- `examples/<Component>/<Case>/index.tsx`
  Use only when the raw example entry file is needed.

## Scope

This skill only covers lynx-ui component packages that already have curated component references in this package. It does not synthesize missing component guides or guarantee coverage for every package in the repository.
