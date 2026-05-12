# @lynx-js/skill-lynx-ui

`@lynx-js/skill-lynx-ui` is the umbrella skill package for curated lynx-ui component references in this repo.

It is structured so another platform can copy the package contents directly into an actual skills folder.

## Published Payload

```text
packages/skill-lynx-ui
|-- SKILL.md
|-- reference.md
|-- examples.md
`-- references
    |-- index.md
    `-- components/<component>/
        |-- guide.md
        |-- api.md
        `-- examples.md
```

The package directory is the final payload shape. Repo-only generator code and tests live under `tools/skill-lynx-ui/`.
Generated payload files are intentionally git ignored in this repository and are produced on demand for validation or publish.

## Skill Payload Workflow

Use the package-level `SKILL.md` as the entrypoint. It should stay short and route agents to the bundled routing guide and generated payload.

Detailed content lives in these files:

- `reference.md`: hand-authored component routing guide
- `examples.md`: top-level generated example catalog
- `references/index.md`: included components and links
- `guide.md`: component usage guidance copied from the component `SKILL.md`
- `api.md`: component API source extracted from `types/index.docs.ts` or `src/types/index.docs.ts`
- `references/components/*/examples.md`: aggregated example entries for a component, sourced from this repo

## Maintenance

Generated outputs are git ignored. Rebuild them locally when needed:

```bash
pnpm --filter @lynx-js/skill-lynx-ui generate:references
```

Validate the generator output shape:

```bash
pnpm --filter @lynx-js/skill-lynx-ui check:references
```
