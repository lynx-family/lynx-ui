# Scaling Design Systems to Lynx

*A working design brief for LUNA design-system interoperability.*

## Status

This working brief captures the current direction for design-system interop
and provides a stable basis for further research. Implementation details and
open questions live in [detailed-design.md](./detailed-design.md).

## Motivation

Interface systems are evolving across platforms, rendering models, and
authoring workflows. Scaling design systems to Lynx requires a portable account
of design intent that can map to Lynx capabilities without making the Web the
default reference model. AI-generated interface work adds urgency by increasing
the need for design-system knowledge that agents can reliably consume.

This design research starts from the coding carriers through which design systems
already express parameters, visual composition, and reusable recipes. The
resulting model should support four outcomes:

1. Refine the LUNA design language and LUNA Skills through comparison with
   mature design systems.
2. Use real design systems to map the coverage and boundaries of Lynx
   experience capabilities.
3. Improve generative UI quality and establish reusable conversion contracts
   from other platforms to Lynx.
4. Progress from consuming design systems to producing them, preparing for
   runtime interface generation.

## Problem

The validation shell at luna/examples/luna-design-system can render examples
and research artifacts. The missing piece is a contract for turning an
external design system into a LUNA theme.

The earlier shadcn and daisyui converters demonstrate that CSS-variable themes
can be extracted and converted. They target the retired lynx-ui token schema
and emit only final values, leaving no place for token provenance, derived
mappings, coverage reporting, or non-CSS inputs.

The new work needs an interop foundation that treats CSS conversion as one
adapter path.

## Design Direction

The canonical intermediate model must be source-format independent.

- CSS is one source adapter within a broader interop contract.
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
| Parameters | Named inputs. A theme binds each input to a value. | CSS variables, design-token files, theme configuration, and Figma Variables | Map serializable theme variables such as `--color-primary: oklch(...)` to `LunaColorId`. |
| Composition | Independent visual or structural operations that can be combined. | Utility classes, CSS properties, style props, and renderer operations | Map the Tailwind utility inventory and its authoring syntax to Lynx capabilities. |
| Recipes | Reusable rules that use parameters and composition to construct UI. | Component definitions, slot recipes, patterns, templates, and Design Skills | Later validate components, component parts, non-component patterns, layouts, and interaction sequences. |

The same feature family may appear in several layers. For example, a spacing
value is a parameter, `gap` is a composition operation, and a responsive
sidebar arrangement is a recipe. Its slots, order, and constraints form the
structural skeleton; their measurements can still come from parameters.

### Parameters: CSS Variables

CSS variables are the first parameter carrier in this work. A declaration such
as `--color-primary: oklch(...)` provides a serializable token identity and
value. The normalized source theme also retains references, context, and
provenance so equivalent parameters can later come from design-token files,
theme configuration, or design tools.

### Composition: Tailwind Utilities and Syntax

Tailwind's documentation taxonomy is a strong inventory of composable visual
operations. The
[Tailwind CSS v3 Utility Support Matrix](https://github.com/lynx-family/lynx-stack/blob/main/packages/tailwind-preset/docs/tailwind-css-v3-support.md)
now maps each utility family through generated CSS to Lynx support,
restrictions, and implementation ownership. It gives the composition layer a
concrete capability contract.

The composition inventory should pair that matrix with authoring syntax:
utility and class grammar, value grammar and token sources, state and context
variants, cascade-layer placement, and generated declarations. Together these
records describe how parameters become operations and preserve relevant
differences between Tailwind versions and extensions.

### Recipes

A recipe combines parameters and composition operations into reusable
structure. It can create primitive structure, assemble existing components, or
mix both. Component boundaries are optional recipe boundaries; UI generation
can also start from lower-level structure.

Recipes define why an interface chooses a particular combination, how slots
relate, how variants co-vary, and how a sequence responds to context. The next
research slice should connect a small number of real recipes to the utility
matrix before expanding into a broader component ontology.

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
declarations create utilities and variants and differ from ordinary custom
properties in :root. v4 additionally supports inline, static,
namespace resets, custom variants, imports, and plugin-defined at-rules.
daisyui builds on the v4 model with @plugin "daisyui/theme" and scoped
data-theme themes.

The CSS adapter must parse selected CSS structures into normalized data and
preserve their provenance. The shared mapping schema keeps CSS syntax out of
the canonical contract. The working support matrix is maintained in
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
| [Design Tokens Community Group format](https://www.designtokens.org/tr/drafts/format/) | Typed values, aliases, and groups provide a portable parameter graph. The format deliberately leaves purpose inference outside group structure, so semantic mapping and component behavior remain outside its scope. |
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
- CSS is represented by an adapter while the canonical model accepts non-CSS
  sources.
- Tailwind v3 and v4 are represented by separate adapters with one shared
  normalized output model.
- shadcn and daisyui fit the shared model without source-specific fields.
- Derived mappings retain the transformation and rationale.
- Unsupported mappings are explicit and never silently omitted.
- The example can render mapping records and coverage from contract data.
- Focused tests verify both initial adapters and mapping modes.
