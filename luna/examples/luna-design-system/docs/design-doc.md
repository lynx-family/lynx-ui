# LUNA Design-System Interop: Working Design Brief

## Status

This is an intermediate design brief. It records the problem, scope, and
decisions stable enough to guide exploration. The evolving schema, fixtures,
parser matrix, and open questions live in
[detailed-design.md](./detailed-design.md).

Do not treat this document as the final public contract. Once the design is
validated with real adapters, publish the settled specification at
docs/interop-contract.md.

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

## Goals

- Define a TypeScript interop contract for current LUNA semantic color tokens.
- Validate the contract with shadcn and daisyui as the first sample systems.
- Make exact, derived, and unsupported mappings explicit and visible in data.
- Preserve evidence without coupling the contract to CSS selectors or files.
- Allow the design-system example to render mappings and validation results.

## Scope

### v1

- Color tokens only, targeting LunaColorId.
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

- Typography, spacing, radius, elevation, motion, and layout-token mapping.
- Component recipes, variants, slots, and behavioral contracts.
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

- design-doc.md: stable motivation, boundaries, and acceptance criteria.
- detailed-design.md: working design space; expected to change during
  exploration.
- docs/interop-contract.md: final repository-level specification after the
  contract and first adapters are accepted.

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
