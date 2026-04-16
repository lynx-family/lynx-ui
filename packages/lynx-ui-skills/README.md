# @lynx-js/lynx-ui-skills

`@lynx-js/lynx-ui-skills` is the umbrella skill package for lynx-ui component references.

It is structured so another platform can copy the package contents directly into an actual skills folder.

## Published Payload

```text
packages/lynx-ui-skills
├── SKILL.md
├── reference.md
├── examples.md
├── examples/
├── template/
└── references
    ├── index.md
    └── components/<component>/
      ├── guide.md
      ├── api.md
      └── examples.md
```

The package directory is the final payload shape. Repo-only generator code, tests, and eval assets live outside the package under `tools/lynx-ui-skills/`.

## Skill Payload Workflow

Use the package-level `SKILL.md` as the entrypoint. It should stay short and route agents to the bundled routing guide and generated payload.

Detailed content lives in these generated files:

- `reference.md`: hand-authored component routing guide
- `examples.md`: top-level example catalog
- `references/index.md`: included components and links
- `guide.md`: component usage guidance copied from the component `SKILL.md`
- `api.md`: component API source extracted from `src/types/index.docs.ts`
- `references/components/*/examples.md`: aggregated example entries for a component
- `examples/<Component>/<Case>/index.tsx`: copied raw example entry files

## Maintenance

Generated outputs are git ignored. Rebuild them locally when needed:

```bash
pnpm --filter @lynx-js/lynx-ui-skills generate:references
```

Validate the generator output shape:

```bash
pnpm --filter @lynx-js/lynx-ui-skills check:references
```

For manual skill evaluation, use:

- `tools/lynx-ui-skills/test/manual-eval.md`
- `tools/lynx-ui-skills/test/eval-cases.json`
