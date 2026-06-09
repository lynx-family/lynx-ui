# @lynx-js/skill-lynx-ui

`@lynx-js/skill-lynx-ui` is the umbrella skill package for curated lynx-ui component references in this repo.

It is structured so ``another platform can copy the package contents directly into an actual skills folder.``

## Published Payload

```text
packages/skill-lynx-ui
|-- SKILL.md
|-- evals/
|   |-- evals.json
|   `-- trigger_eval.json
`-- references
    |-- foundation.md
    |-- component-overview.md
    |-- theming-and-tokens.md
    |-- motion.md
    |-- component-composition.md
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

- cross-cutting lynx-ui guidance under `references/*.md`
- the generated component routing guide in `references/component-overview.md`
- generated per-component references under `references/components/<component>/`

Detailed content lives in these files:

- `references/foundation.md`: setup and troubleshooting boundaries
- `references/component-overview.md`: generated component-family routing guide
- `references/theming-and-tokens.md`: Luna themes and token guidance
- `references/motion.md`: motion versus motion-mini guidance
- `references/component-composition.md`: common component combinations
- `guide.md`: component usage guidance copied from the component `SKILL.md`
- `api.md`: component API source extracted from `types/index.docs.ts` or `src/types/index.docs.ts`
- `references/components/*/examples.md`: aggregated example entries for a component, sourced from this repo
- `evals/evals.json`: eval coverage for enriched lynx-ui task routing
- `evals/trigger_eval.json`: trigger coverage for lynx-ui skill activation

## Maintenance

Generated outputs are git ignored. Rebuild them locally when needed:

Component routing metadata is maintained centrally in
`tools/skill-lynx-ui/component-routing.json`. The reference check requires every
component package with API docs to be routed or explicitly excluded with a reason.
Common cross-component combinations are maintained by hand in
`tools/skill-lynx-ui/references/component-composition.md`.

```bash
pnpm --filter @lynx-js/skill-lynx-ui generate:references
```

Validate the generator output shape:

```bash
pnpm --filter @lynx-js/skill-lynx-ui check:references
```
