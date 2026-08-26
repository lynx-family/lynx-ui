# LUNA Design-System Interop: Working Design Brief

## Status

This is an intermediate design brief. It records the problem, scope, and
decisions stable enough to guide exploration. The evolving schema, fixtures,
parser matrix, and open questions live in
[detailed-design.md](./detailed-design.md).

Do not treat this document as the final public contract. Once the design is
validated with real adapters, publish the settled specification at
docs/interop-contract.md.

## Motivation

AI-generated interface work is increasing the demand for design-system
knowledge that agents can inspect, translate, and apply. Beginning with a final
artifact such as `DESIGN.md`, then translating every Web convention directly
to Lynx, makes the work sensitive to source details and to prompting formats
that will change as models improve.

This research instead starts from the coding carriers through which design
systems already express parameters, visual composition, and reusable recipes.
The resulting model should support four outcomes:

1. Evolve the LUNA design language and LUNA Skills through comparison with
   mature design systems.
2. Use real design systems to map the coverage and boundaries of Lynx
   experience capabilities.
3. Improve generative UI quality and establish reusable conversion contracts
   from other platforms to Lynx.
4. Progress from consuming design systems to producing them, preparing for
   runtime interface generation.

## Problem

luna/examples/luna-design-system is a working validation shell, but it does
not define how an external design system becomes a LUNA theme.

The earlier shadcn and daisyui converters demonstrate that CSS-variable themes
can be extracted and converted. They target the retired lynx-ui token schema,
however, and emit only final values. They cannot retain token provenance,
express derived mappings, report coverage, or represent inputs that are not
CSS.

The new work must define an interop foundation, not another CSS-only converter.

## Design Direction

The canonical intermediate model must be source-format independent.

- CSS is one source adapter, not the interop contract.
- A normalized source theme retains token identity, raw value, references,
  context, and provenance.
- Mapping data records the semantic relationship from normalized source tokens
  to current LUNA tokens.
- Resolution produces LUNA values, diagnostics, and coverage data.

The intended flow is:

```text
External inputs -> source adapter -> normalized source theme
                -> interop mapping -> resolved LUNA theme + report
```

## A Minimal Model

| Layer | Definition | Typical carrier | Current work |
| --- | --- | --- | --- |
| Parameters | Named inputs. A theme binds each input to a value. | CSS variables, design-token files, theme configuration, and Figma Variables | Map serializable Tailwind theme variables such as `--color-primary: oklch(...)` to `LunaColorId`. |
| Composition | Independent visual or structural operations that can be combined. | Utility classes, CSS properties, style props, and renderer operations | Use the Tailwind utility taxonomy to review utilities such as `flex`, `gap-4`, `opacity-50`, and `blur-sm` against Lynx. |
| Recipes | Reusable rules that use parameters and composition to construct UI. | Component definitions, slot recipes, patterns, templates, and Design Skills | Later validate components, component parts, non-component patterns, layouts, and interaction sequences. |

A recipe can create primitive structure, assemble existing components, or mix
both. A component is one possible recipe boundary rather than the required
starting point for UI generation.

The same feature family may appear in several layers. For example, a spacing
value is a parameter, `gap` is a composition operation, and a responsive
sidebar arrangement is a recipe. Its slots, order, and constraints form the
structural skeleton; their measurements can still come from parameters.

### What the Tailwind v3 Review Establishes

Tailwind's documentation taxonomy is a strong inventory of composable visual
operations. The
[Tailwind CSS v3 support review for Lynx](https://github.com/lynx-family/lynx-stack/pull/3868)
maps each utility family through generated CSS to Lynx support, restrictions,
and implementation ownership. It therefore produces a capability contract for
the composition layer.

That contract cannot explain why an interface chooses a particular
combination, how slots relate, how variants co-vary, or how a sequence responds
to context. Those concerns belong to recipes. The next research slice should
connect a small number of real recipes to the utility matrix instead of
expanding immediately into an exhaustive component ontology.

### Artifacts Are Projections

`DESIGN.md`, Design Skills, generated code, support matrices, and test fixtures
serve different consumers. They should be generated or curated as projections
of the same parameters, composition capabilities, recipes, and semantic
contracts. This keeps the durable model separate from artifact formats and
model-specific prompting techniques that will continue to evolve.

## Goals

- Define a TypeScript interop contract for current LUNA semantic color tokens.
- Validate the contract with shadcn and daisyui as the first sample systems.
- Make exact, derived, and unsupported mappings explicit and visible in data.
- Preserve evidence without coupling the contract to CSS selectors or files.
- Allow the design-system example to render mappings and validation results.

## Scope

### v1

- The first parameter-system slice: color tokens targeting `LunaColorId`.
- A Tailwind v3 adapter first, aligned with the current Lynx CSS compatibility
  profile and accepting resolved v3 theme configuration plus custom CSS.
- A separate Tailwind v4 adapter, with its own CSS-first input model and
  Tailwind-specific syntax handling.
- shadcn and daisyui fixtures that exercise both adapter tracks where their
  source formats apply.
- A normalized source-theme model that can also represent JSON or TypeScript
  configuration inputs later.
- Mapping records, transform metadata, diagnostics, and coverage reporting.
- Fixtures and focused tests for both sample systems.

### Deferred

- Additional parameter domains: typography, spacing, radius, elevation,
  motion, and layout values.
- Composition contracts beyond the Tailwind/Lynx capability review, including
  renderer-sensitive paint, typography, layout, and effect semantics.
- Recipes: component anatomy, variants, slots, contextual policies, sequences,
  and behavioral contracts.
- A general-purpose CSS compiler or a full emulation of Tailwind or daisyui.
- Automatic semantic inference from token names or color values.

## CSS Is an Adapter Concern

Tailwind requires two explicit adapter tracks. The first targets Tailwind v3,
whose theme is defined in JavaScript or TypeScript configuration and compiled
through build-time directives. The second targets Tailwind v4, whose @theme
declarations create utilities and variants and are not interchangeable with
ordinary custom properties in :root. v4 additionally supports inline, static,
namespace resets, custom variants, imports, and plugin-defined at-rules.
daisyui builds on the v4 model with @plugin "daisyui/theme" and scoped
data-theme themes.

The CSS adapter must parse selected CSS structures into normalized data and
preserve their provenance. It must not make CSS syntax part of the shared
mapping schema. The working support matrix is maintained in
[detailed-design.md](./detailed-design.md#css-input-research).

## Component-System Research

The initial systems deliberately exercise different input shapes:

- **shadcn**: semantic custom properties with paired light and dark contexts.
- **daisyui**: Tailwind plugin syntax, named themes, and component-scale values.

The next candidates are Radix Themes, Material 3, Fluent UI, Spectrum, Carbon,
Chakra UI, and Ant Design. They cover CSS scale systems, structured token data,
Sass inputs, TypeScript configuration, and algorithm-generated themes. The
research rationale and recommended sequencing are in
[detailed-design.md](./detailed-design.md#candidate-design-systems).

## Document Lifecycle

| Document | Role in the research model |
| --- | --- |
| `design-doc.md` | Stable motivation, the three-layer model, boundaries, and acceptance criteria |
| [mapping.md](./mapping.md) | Source-system inventory and evidence, with the first emphasis on parameter systems |
| [rendering-foundations.md](./rendering-foundations.md) | Composition and realization taxonomy, including the Tailwind and renderer capability maps |
| [contract-model.md](./contract-model.md) | Semantic and contextual correspondence across systems, independent of concrete values |
| [detailed-design.md](./detailed-design.md) | Adapters, normalized data, resolution, diagnostics, fixtures, and other implementation decisions |
| `docs/interop-contract.md` | Final repository-level specification after the contract and first adapters are accepted |

## Prior-Art Lens: Design Systems

Mature design systems reach code through several carriers. Comparing those
carriers separately reveals what each system considers stable, configurable,
composable, and reusable.

| Prior art | Relevant lesson |
| --- | --- |
| [Design Tokens Community Group format](https://www.designtokens.org/tr/drafts/format/) | Typed values, aliases, and groups provide a portable parameter graph. The format deliberately does not infer purpose from group structure, so semantic mapping and component behavior remain outside its scope. |
| [Material Design](https://m3.material.io/foundations/design-tokens/overview) | Reference, system, and component-level choices illustrate progressive binding from generated or authored values to semantic roles and component realization. Its adaptive color and motion work also shows that a parameter may be produced at runtime while preserving a stable role. |
| Tailwind CSS | The utility taxonomy treats visual styling as a grammar of independent operations that can be composed close to markup. The Lynx support matrix turns that grammar into a concrete target-capability map, while product structure and interaction intent remain application concerns. |
| [Chakra UI slot recipes](https://chakra-ui.com/docs/theming/slot-recipes) and [Panda CSS slot recipes](https://panda-css.com/docs/concepts/slot-recipes) | Slots, base styles, variants, default variants, and compound variants form a compact coding carrier above utilities and tokens. Styling recipes cover reusable component anatomy well; complete interoperability must additionally preserve behavior, accessibility, temporal sequence, and environmental context. |

The main lesson is to preserve the boundaries between parameters, composition,
and recipes while connecting them through explicit references. This supports
global consistency and local variation, permits each layer to be compared or
migrated independently, and provides stable source material for agent-facing
artifacts.

## Existing References

- Baseline validation app: luna/examples/luna-design-system
- Current LUNA color schema: luna/packages/luna-core/src/theme/color.ts
- Previous shadcn experiment:
  lynx-theme/tools/theme-converter/bin/theme-converter-shadcn.js
- Previous daisyui experiment:
  lynx-theme/tools/theme-converter/bin/theme-converter-daisyui.js

## Implementation Tasks

- [ ] Confirm the v1 color-only boundary.
- [ ] Define the normalized source-theme model and provenance model.
- [ ] Implement and validate the Tailwind v3 adapter against the Lynx CSS
      compatibility profile.
- [ ] Implement the Tailwind v4 adapter independently of the v3 resolver.
- [ ] Define mapping modes and structured derived transforms.
- [ ] Define coverage and diagnostic output.
- [ ] Create minimal shadcn and daisyui fixtures.
- [ ] Implement source adapters separately from mapping evaluation.
- [ ] Add focused parser, mapping, and coverage tests.
- [ ] Add the /interop/:system display route after contract data exists.
- [ ] Promote accepted decisions into docs/interop-contract.md.

## Acceptance Criteria

- The shared contract targets current LUNA tokens only.
- CSS is represented by an adapter and is not required by the canonical model.
- Tailwind v3 and v4 are represented by separate adapters with one shared
  normalized output model.
- shadcn and daisyui fit the shared model without source-specific fields.
- Derived mappings retain the transformation and rationale.
- Unsupported mappings are explicit rather than silently omitted.
- The example can render mapping records and coverage from contract data.
- Focused tests verify both initial adapters and mapping modes.
