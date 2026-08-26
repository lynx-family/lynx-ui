# LUNA Design-System Interop: Detailed Design Workspace

## Status

This is a working document. It contains proposals and research notes, not an
accepted public API. Keep settled decisions concise in design-doc.md, then
promote the completed specification to docs/interop-contract.md.

## Architectural Hypothesis

The interop layer needs three independent concerns:

1. **Source adapters** read CSS, JSON, TypeScript configuration, generated
   output, or documented values.
2. **Normalized source themes** retain source identity and values without
   inheriting source syntax.
3. **Mappings and resolution** connect source semantics to LUNA, then report
   exactness, derivations, unsupported cases, and coverage.

This avoids treating a CSS file as the semantic source of truth. CSS may carry
runtime values, but a mapping decision and its rationale must survive a change
of source format.

## Tailwind Adapter Tracks

Tailwind v3 and v4 must remain separate adapters. They share the normalized
output model, but their source of truth, build semantics, and syntax differ.

### Tailwind v3: First Compatibility Adapter

The Tailwind v3 adapter is the first implementation target because it aligns
with the current Lynx CSS compatibility profile. This is a compatibility target
for the adapter, not a Lynx SDK version range.

| Source feature | Adapter treatment |
| --- | --- |
| theme and theme.extend in tailwind.config.js, .cjs, .mjs, or .ts | Obtain resolved theme data through a supported Tailwind resolver or accept resolved data as input. Do not execute arbitrary user configuration in the adapter. |
| presets and plugins | Treat as resolver inputs. Record the resolved source and version as provenance. |
| @tailwind, @layer, @apply, and @config | Build-time directives, not canonical token declarations. Consume them only through a compiled CSS input or a Tailwind-aware resolver. |
| theme() and screen() | Build-time functions. Resolve before normalization or retain them as unresolved build-time expressions. |
| CSS custom properties | Parse as ordinary CSS input and normalize their selector context. |

The Tailwind v3 adapter should emit only values compatible with its target
Lynx CSS compatibility profile when it produces Lynx-facing output. It may
retain unsupported source expressions in normalized data for reporting.

### Tailwind v4: Separate CSS-First Adapter

Tailwind v4 uses a different source model. Its adapter must not reuse the v3
configuration resolver as an implementation shortcut.

## Working Model

The following is deliberately illustrative, not the proposed public API:

```ts
type SourceFormat = "css" | "json" | "typescript" | "generated" | "documentation"

type NormalizedSourceToken = {
  id: string
  name: string
  value: string
  references: readonly string[]
  contexts: readonly string[]
  provenance: {
    format: SourceFormat
    locator: string
  }
}

type MappingMode = "exact" | "derived" | "unsupported"
```

The model needs to distinguish raw values from resolved values. For example,
var(--color-primary) is a source-level alias, while a resolved CSS color may
depend on a selector, ancestor, media condition, or fallback.

## CSS Input Research

### Design Rule

Use PostCSS as the AST parser for CSS adapters. Regex is insufficient for
nested rules, comments, strings, functions, custom at-rules, and selector
scoping. The adapter should preserve raw declarations and a constrained context
model; it should not attempt to execute an arbitrary browser cascade in v1.

### Required for Initial Adapters

| Syntax or behavior | Why it matters | v1 treatment |
| --- | --- | --- |
| Custom property declarations | Core token values | Parse raw name and value. |
| var(--token, fallback) | Alias and fallback semantics | Preserve references and fallback text. |
| :root, .dark, [data-theme], and nested theme scopes | Theme identity and inheritance | Normalize as selector contexts. |
| Comma-separated selectors and CSS nesting | Common authoring forms | Parse through the AST. |
| @import ordering and @layer | Changes which declaration wins | Retain source order and layer metadata. |
| @media and @supports | Theme values can be conditional | Retain conditions; do not resolve arbitrary conditions. |
| Modern color functions | shadcn and daisyui use them | Parse with PostCSS and preserve the raw value, including oklch(), modern space-separated hsl()/rgb(), alpha slash syntax, color(), and color-mix(). An optional PostCSS lowering pass may produce a target-compatible color only when every input is statically resolvable; retain the original expression and provenance. |
| calc() | Tokens can be computed dimensions | Preserve raw expression and references. The Tailwind v3 adapter may emit it only when the receiving property accepts a length-percentage expression in Lynx. |
| min(), max(), clamp() | Modern CSS math functions | Preserve the expression, report an incompatible value under the Tailwind v3 adapter's Lynx CSS compatibility profile, and do not emit it as Lynx-facing output. |

### Lynx CSS Compatibility Rules for the Tailwind v3 Adapter

The Tailwind v3 adapter is constrained by the current documented Lynx behavior,
not by browser CSS support:

| Function or behavior | Status | Adapter rule |
| --- | --- | --- |
| var() and custom-property inheritance | Supported | Preserve aliases, fallbacks, and selector scope. |
| calc() in length-percentage properties | Supported | Permit arithmetic expressions for compatible receiving properties. |
| calc() in colors, enum properties, or plain numeric properties | Unsupported | Preserve as source data and report an incompatible value. |
| min(), max(), clamp() CSS math functions | Unsupported | Preserve losslessly, report an incompatible value, and do not resolve or emit as Lynx-compatible output. |
| minmax() grid track syntax | Separate grid syntax | Do not classify it as CSS min() or max() support. |

Evidence: Lynx documents calc() for length-percentage values and custom
properties, including aliases and fallbacks. The CSS min(), max(), and clamp()
math functions are currently unsupported. The adapter must preserve them as
source expressions but reject them for Lynx-facing output unless future native
runtime evidence establishes support.

### Tailwind v4-Specific Syntax

| Syntax | Interop implication |
| --- | --- |
| Top-level @theme | A theme variable declaration also creates a Tailwind utility or variant API; it is not simply equivalent to :root. |
| @theme inline | The generated utility uses the referenced value directly, which affects alias resolution. |
| @theme static | All variables are emitted, including unused ones; generated CSS alone cannot establish author intent. |
| --color-*: initial and --*: initial | A namespace or whole theme can be reset; the adapter must record resets rather than assume default values exist. |
| @custom-variant | A theme may be represented by arbitrary selectors instead of .dark. |
| @plugin and @plugin "daisyui/theme" | Third-party DSL blocks carry named theme metadata and custom-property values. |
| @source, @utility, and arbitrary values | They influence compilation or consumption, but are not source theme tokens by themselves. |

### Deferred CSS Features

- Full browser-cascade evaluation across arbitrary selectors and DOM trees.
- @property registration and its initial-value fallback behavior.
- Sass, Less, or CSS Modules compilation. Treat compiled CSS or dedicated
  structured adapters as separate sources.
- Evaluation of env(), relative colors, light-dark(), URL/image values, or
  arbitrary plugin code.

### daisyui Observation

Current daisyui theme authoring uses @plugin "daisyui/theme" metadata such
as name, default, prefersdark, and color-scheme, followed by custom
properties. Themes can also be scoped and nested with data-theme. The CSS
adapter must surface the metadata as theme context rather than infer it only
from a filename.

## Candidate Design Systems

Keep the first implementation bounded to shadcn and daisyui fixtures for both
Tailwind adapter tracks. The systems below are ordered by the next contract
question each one answers, rather than visual preference or ecosystem size.

| Priority | System | Input shape to study | What it tests | Recommended stage |
| --- | --- | --- | --- | --- |
| 0 | shadcn | Tailwind v3 config plus semantic CSS variables; Tailwind v4 CSS-first fixture | Light/dark semantic themes across both adapter tracks | Initial baseline |
| 0 | daisyui | Legacy plugin/config theme fixture plus v4 CSS plugin DSL | Named and nested themes, component-scale values, and theme metadata | Initial baseline |
| 1 | HeroUI v3, previously NextUI | Tailwind v4, CSS variables, standalone styles, and parallel Web/React Native libraries | Shared tokens across platform-specific renderers; slot anatomy, compound components, and accessible component styling | First post-baseline validation |
| 1 | Tamagui | TypeScript createTamagui config, compiler output, tokens, nested and component themes | A non-CSS-first source model; native/web resolution, token fallback, state-specific and component-specific themes | First post-baseline validation |
| 2 | Radix Themes | CSS variable scales and React theme props | 12-step scales, alpha values, scoped accent/focus overrides | Next CSS-scale adapter |
| 2 | Material 3 | Structured design-token data | Reference, system, and component layers; contexts and dynamic color | Next data adapter |
| 2 | Fluent UI | Structured global and alias tokens | Alias/composite tokens, high contrast, and cross-platform contexts | Next data adapter |
| 3 | Spectrum | Token package data | Aliases, component-specific tokens, platform and scale contexts | Later |
| 3 | Chakra UI | TypeScript configuration | Structured token references, semantic conditions, and recipes | Later |
| 3 | Carbon | Sass token maps | Semantic role-based themes and compile-time input | Later |
| 4 | Ant Design | Runtime configuration and algorithms | Seed, derived map, alias, and component tokens | Research-only until an execution model exists |

HeroUI v3 and Tamagui are the highest-value post-baseline pair. HeroUI probes a
modern Tailwind v4 design system with Web and React Native implementations that
share tokens but use different renderers. Tamagui probes a fundamentally
different configuration and compiler model, so a contract that represents both
is less likely to be accidentally CSS-shaped.

## Component-Level Interop

Token conversion and component interoperability are separate layers. A future
component contract must be able to represent at least:

- component identity and anatomy or slots
- variant and size dimensions
- interaction and validation state
- density, platform, direction, contrast, and theme contexts
- visual token bindings for each component part
- behavioral and accessibility capabilities

Material 3, Spectrum, Fluent UI, Chakra recipes, and Ant Design component
tokens demonstrate why component metadata cannot be reduced to a flat list of
colors. Component-level mapping is explicitly deferred from v1.

## Open Questions

- Should normalized values be typed immediately, or remain lossless CSS/data
  expressions until resolution?
- How should multiple simultaneous contexts be represented: ordered selectors,
  independent dimensions, or source-specific condition sets?
- Which transform operations are safe to standardize in v1: alias, opacity,
  blend, fallback, split, and merge?
- Does the interop package own CSS parsing, or should adapters accept an AST
  supplied by their caller?
- What evidence is sufficient for a mapping: source documentation, fixture
  comments, adapter rules, or all three?

## References

- [Tailwind v3 configuration](https://v3.tailwindcss.com/docs/configuration)
- [Tailwind v3 functions and directives](https://v3.tailwindcss.com/docs/functions-and-directives)
- [Tailwind v4 theme variables](https://tailwindcss.com/docs/theme)
- [Tailwind v4 functions and directives](https://tailwindcss.com/docs/functions-and-directives)
- [daisyui themes](https://daisyui.com/docs/themes/)
- [HeroUI React documentation](https://heroui.com/docs/react/getting-started)
- [HeroUI Native](https://heroui.com/docs/native/getting-started)
- [Tamagui introduction](https://tamagui.dev/docs/intro/introduction)
- [Tamagui themes](https://tamagui.dev/docs/intro/themes)
- [Lynx CSS variables](https://lynxjs.org/api/css/properties/css-variable)
- [Lynx length-percentage](https://lynxjs.org/next/api/css/data-type/length-percentage.html)
- [Lynx CSS styling](https://lynxjs.org/guide/ui/styling.html)
- [Design Tokens Format Module 2025.10](https://www.designtokens.org/TR/2025.10/format/)
- [Material 3 design tokens](https://m3.material.io/foundations/design-tokens)
- [Radix Themes colors](https://www.radix-ui.com/themes/docs/theme/color)
- [Fluent design tokens](https://fluent2.microsoft.design/design-tokens)
- [Spectrum design tokens](https://spectrum.adobe.com/page/design-tokens/)
- [Carbon themes](https://carbondesignsystem.com/guidelines/themes/overview/)
- [Chakra UI tokens](https://chakra-ui.com/docs/theming/tokens)
- [Ant Design theme customization](https://ant.design/docs/react/customize-theme)
