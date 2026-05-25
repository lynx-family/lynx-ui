# @lynx-js/skill-lynx-ui

`@lynx-js/skill-lynx-ui` is the umbrella skill package for curated lynx-ui component references in this repo.

It is structured so another platform can copy the package contents directly into an actual skills folder.

## Published Payload

```text
packages/skill-lynx-ui
|-- SKILL.md
|-- reference.md
|-- examples.md
|-- evals/
|   `-- evals.json
`-- references
    |-- foundation.md
    |-- components.md
    |-- theming-and-tokens.md
    |-- motion.md
    |-- screen-recipes.md
    |-- index.md
    `-- components/<component>/
        |-- guide.md
        |-- api.md
        `-- examples.md
```

The package directory is the final payload shape. Repo-only generator code, authored reference sources, and tests live under `tools/skill-lynx-ui/`.
Generated component payload files are intentionally git ignored in this repository and are produced on demand for validation or publish.
The generator copies bundled orchestration references from `tools/skill-lynx-ui/references/` into the package payload alongside generated component references.

## Skill Payload Workflow

Use the package-level `SKILL.md` as the entrypoint. It routes agents to:

- cross-cutting Lynx UI guidance under `references/*.md`
- the package-specific component routing guide in `reference.md`
- generated per-component references under `references/components/<component>/`

Detailed content lives in these files:

- `references/foundation.md`: setup, adaptation rules, and troubleshooting boundaries
- `references/components.md`: component-family lookup and official-pattern guidance
- `references/theming-and-tokens.md`: Luna themes and token guidance
- `references/motion.md`: motion versus motion-mini guidance
- `references/screen-recipes.md`: multi-component screen composition patterns
- `reference.md`: compact routing guide for generated component coverage in this repo
- `examples.md`: top-level generated example catalog
- `references/index.md`: included generated components and links
- `guide.md`: component usage guidance copied from the component `SKILL.md`
- `api.md`: component API source extracted from `types/index.docs.ts` or `src/types/index.docs.ts`
- `references/components/*/examples.md`: aggregated example entries for a component, sourced from this repo
- `evals/evals.json`: eval coverage for enriched Lynx UI task routing

## Maintenance

Generated outputs are git ignored. Rebuild them locally when needed:

```bash
pnpm --filter @lynx-js/skill-lynx-ui generate:references
```

Validate the generator output shape:

```bash
pnpm --filter @lynx-js/skill-lynx-ui check:references
```
