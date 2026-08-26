# Scaling Design Systems to Lynx: Mapping Research

<!-- cspell:words DTCG heroui fluentui Uniwind Penpot srgb mytheme -->

Research date: 2026-08-28. This document records source research and integration proposals for the RFC. Adapter implementation, schema approval, and Lynx capability validation are subsequent work.

## 1. Research Context

The goal is to bring mature design systems into Lynx through repeatable, scalable integration, supporting LUNA design language development, lynx-ui component consumption, experience capability assessment, and agent consumption through DESIGN.md and Design Skills. A component library is one realization of a design system; integration also needs to preserve rules, contexts, behavior, and design rationale.

This research follows the boundaries established in the existing documents:

- [Working Design Brief](./design-doc.md): v1 maps colors to the current `LunaColorId` vocabulary, starting with shadcn and daisyui through separate Tailwind v3 and v4 adapters.
- [Detailed Design](./detailed-design.md): preserve source identity, raw expressions, references, contexts, and provenance. Component recipes, slots, and behavioral contracts remain outside v1.
- [Contract Model](./contract-model.md): contracts map semantics; resolution determines their realization in context. A table of resolved colors records one outcome of that contract.

The research distinguishes three kinds of objects:

| Object                              | Question                                                                | Examples                                                    |
| ----------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------- |
| Design system                       | Which design intents, relationships, and constraints must be preserved? | Material, Fluent, LUNA                                      |
| Authoring / exchange representation | Where are definitions stored, and how can they be read?                 | Figma Variables, DTCG JSON, CSS, TypeScript                 |
| Consumer / realization              | How are definitions consumed or implemented?                            | DESIGN.md, Design Skills, component libraries, Lynx runtime |

**LUNA defines a perceptually grounded semantic / functional layer.** Its vocabulary describes surface character, content presence, emphasis, and separation, with functional roles such as `primary` and `primary-content`. The [LUNA naming philosophy](../../../packages/luna-tokens/README.md) makes these qualities reusable across components and media. Reference palettes supply values; component recipes bind these roles to particular parts and states.

**Working hypothesis: the canonical representation preserves source roles, relationships, and contexts in a stable project model.** Mappings then connect those definitions to LUNA's vocabulary. Concepts without a direct target equivalent remain in the source model; distinguish differences in semantic scope from missing perceptual roles or runtime capabilities before proposing changes to LUNA.

## 2. Design Systems to Map

### 2.1 Integration Order

The original 11 systems come from the existing Detailed Design. Material 2 / MUI is added here as another research baseline; the v1 implementation order remains unchanged. Priorities indicate research order. The extraction approaches below are proposals; subsequent sections provide sources and limitations.

| Priority | System / version boundary                                          | Preferred structured input                                        | Main validation question                                                         |
| -------- | ------------------------------------------------------------------ | ----------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| P0       | shadcn/ui; pin separate Tailwind v3 and v4 project snapshots       | Semantic CSS variables; registry JSON `cssVars`                   | Background / content pairs, light / dark, provenance after project customization |
| P0       | daisyui; separate legacy configuration from the current CSS plugin | Theme CSS, `@plugin` metadata; legacy theme objects               | Multiple themes, nested scopes, theme selection rules                            |
| P1       | HeroUI v3; do not mix in v2 / NextUI configuration                 | `@heroui/styles`, separate Web / Native theme definitions         | Shared semantics across different renderers                                      |
| P1       | Tamagui                                                            | `createTokens` / `createTamagui` configuration, theme definitions | Non-CSS inputs, theme inheritance, platform resolution, fallback                 |
| P2       | Radix Themes / Radix Colors                                        | Color scales, theme CSS, Theme props                              | Scale usage, alpha / gamut, local accent overrides                               |
| P2       | Material 3                                                         | Versioned token sources, Material Color Utilities                 | Reference / system / component layers, dynamic color generation                  |
| P2       | Material 2 / MUI; pin the MUI package version                      | Resolved palette objects with original paths and mode             | Brand / status pairs, text and action roles, limits of theming DSL coupling      |
| P2       | Fluent 2 / Fluent UI React v9                                      | `@fluentui/tokens` types, themes, alias definitions               | Global / alias layers, state, brand, high contrast                               |
| P3       | Spectrum; distinguish S1 from S2                                   | Token data and component schemas in `spectrum-design-data`        | Structured component definitions beyond tokens, mode / scale                     |
| P3       | Chakra UI v3                                                       | `tokens`, `semanticTokens`, recipes / slot recipes                | Conditional semantics, composite values, component slot bindings                 |
| P3       | Carbon; pin the package version                                    | `@carbon/themes` JS exports; Sass maps / CSS                      | Semantic roles, layered themes, information lost during compilation              |
| P4       | Ant Design; pin the version of the token API                       | Seed / Map / Alias types, algorithms, component tokens            | Algorithmic resolution and the limits of static snapshots                        |

### 2.2 shadcn/ui

**Sources:** [Theming](https://ui.shadcn.com/docs/theming), [Registry item schema](https://ui.shadcn.com/docs/registry/registry-item-json).

- **Available definitions:** semantic variables with light / dark values. Registry items can include `cssVars.theme`, `cssVars.light`, `cssVars.dark`, and component files. The registry schema describes distribution, not component behavior.
- **Extraction proposal:** read theme data directly from JSON, and use PostCSS for CSS inputs. Preserve role pairs such as `background` / `foreground` and `primary` / `primary-foreground`, along with references in `@theme inline`. Read customized source files from the actual project rather than replacing its changes with the official default theme.
- **Limitations:** the interactive surface role of `accent` must not be equated with LUNA `primary` based on naming alone. Evaluate `ring`, `destructive`, and chart tokens separately. Component variants and states require source, type, and documentation analysis; a registry file list does not establish a complete interaction contract.

### 2.3 daisyui

**Sources:** [Themes](https://daisyui.com/docs/themes/), [Theme source files](https://github.com/saadeghi/daisyui/tree/master/packages/daisyui/src/themes).

- **Available definitions:** named themes, semantic custom properties, and metadata such as `name`, `default`, `prefersdark`, and `color-scheme` in `@plugin "daisyui/theme"`.
- **Extraction proposal:** separate token data, the theme manifest, and scope / selection rules. Preserve nested `data-theme` scopes and surface / content pairs. Collect legacy JS plugin configuration as separate versioned fixtures instead of interpreting it through the current DSL.
- **Limitations:** retain radius, size, and depth as source data, but exclude them from v1 color mapping coverage. Do not flatten every derived expression in component CSS into a constant.

### 2.4 HeroUI v3

**Sources:** [Web theming](https://heroui.com/en/docs/react/getting-started/theming), [v2 → v3 styling migration](https://heroui.com/en/docs/react/migration/styling), [Native theming](https://heroui.com/en/docs/native/getting-started/theming).

- **Available definitions:** v3 Web uses a standalone styles package and Tailwind v4 theming; Native uses CSS theme definitions through Uniwind. The migration documentation identifies changes to the v2 plugin and token names.
- **Extraction proposal:** read semantic variables and derived expressions from a pinned styles package, then record platform, state attributes, and component part bindings separately for Web and Native. Test the contract with examples of the same role in both implementations without assuming identical token sets.
- **Limitations:** Web CSS, React Aria behavior, and Native Uniwind processing do not establish Lynx support. Renderer capability mapping remains a separate task.

### 2.5 Tamagui

**Sources:** [Tokens](https://tamagui.dev/docs/core/tokens), [Themes](https://tamagui.dev/docs/intro/themes).

- **Available definitions:** tokens, themes, and configuration objects. Theme naming can express parent / child relationships and component themes.
- **Extraction proposal:** accept serializable configuration snapshots from the caller, preserving the distinction between tokens and themes, references, inheritance, and component scopes. Retain compiled output for cross-checking. Read supported object structures through an AST, leaving functions that cannot be interpreted statically unresolved.
- **Limitations:** compilation to CSS variables and resolution to Native values are different realizations. Compiled CSS is not the complete source definition, and a generic adapter must not execute arbitrary user configuration.

### 2.6 Radix Themes / Radix Colors

**Sources:** [Themes color system](https://www.radix-ui.com/themes/docs/theme/color), [Color scale use cases](https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale).

- **Available definitions:** 12-step scales with light / dark and transparent variants. Theme and component props can select or override parameters such as the accent color.
- **Extraction proposal:** record scales, documented usage groups, and contexts, then read semantic aliases from Themes. Keep transparent and opaque values distinct. Use background, interactive surface, border, and text roles as mapping evidence rather than aligning scale indices directly with LUNA.
- **Limitations:** the same transparent color appears differently over different backgrounds. A composited color is one resolution result, not a replacement for the original alpha definition.

### 2.7 Material 3

**Sources:** [Design tokens](https://m3.material.io/foundations/design-tokens/overview), [Material Web token sources](https://github.com/material-components/material-web/tree/main/tokens), [Material Color Utilities](https://github.com/material-foundation/material-color-utilities), [Dynamic color sources](https://github.com/material-foundation/material-color-utilities/tree/main/typescript/dynamiccolor).

- **Available definitions:** reference, system, and component token sources, plus color generation algorithms. Public assets do not constitute a single official DTCG JSON file covering all of Material 3.
- **Extraction proposal:** extract token layers and references from one pinned implementation. Represent color generation as `resolver ID + version + inputs + context`, and sample seed, appearance, and contrast parameters to produce comparable resolved fixtures.
- **Limitations:** record Material Web token versions, Material Color Utilities algorithm versions, and other platform implementations separately. Do not combine them into one set of “latest Material values.” Dynamic color is a contextual function; one default palette does not represent its full behavior.

### 2.8 Material 2 / MUI

**Sources:** [Material 2 color system](https://m2.material.io/design/color/the-color-system.html), [Material UI positioning](https://mui.com/material-ui/getting-started/), [Palette documentation](https://mui.com/material-ui/customization/palette/), [Default theme viewer](https://mui.com/material-ui/customization/default-theme/), [MUI palette source](https://github.com/mui/material-ui/blob/809a7717b4c050ba3f69b75300689f07c050a16e/packages/mui-material/src/styles/createPalette.js).

- **Why include it:** MUI provides a substantial React ecosystem of existing themes and applications to study for transfer to Lynx. Material 2 is the design-system generation; MUI has its own package versions, palette API, and implementation choices. Keep those identities separate from Material 3 and Material Web.
- **Available definitions:** the resolved `palette` object exposes brand / status color families, text, surfaces, dividers, action states, reference colors, and generation parameters. The complete default instances in Section 3.6 use `@mui/material@9.4.0`.
- **Extraction proposal:** accept a plain resolved palette snapshot for each mode, preserving original object paths, alpha values, source version, and available authored references. Review semantic correspondence at this data boundary.
- **Limits of integration:** MUI's `sx` shorthand, responsive values, theme callbacks, provider composition, `components.styleOverrides`, variants, and CSS-variable generation form a coupled theming DSL. Keep that execution model outside the initial adapter. Custom projects should supply resolved palette data; retain unavailable derivations as unresolved.

### 2.9 Fluent 2 / Fluent UI

**Sources:** [Design tokens](https://fluent2.microsoft.design/design-tokens), [Token package](https://github.com/microsoft/fluentui/tree/master/packages/tokens), [Token sources](https://github.com/microsoft/fluentui/tree/master/packages/tokens/src).

- **Available definitions:** global tokens provide foundational values, while alias tokens introduce purpose. Some typography / shadow aliases contain composite values, with support for different theme contexts.
- **Extraction proposal:** use React v9 token types as the field inventory and theme / alias sources for values and dependencies. Record state, brand, and contrast separately. Types provide the shape; source and documentation provide the definition. Both are needed.
- **Limitations:** Web token data does not replace system behavior on Windows, iOS, or other platforms. Preserve environment dependencies for system colors or forced-colors behavior instead of fixing them to RGB values from the default theme.

### 2.10 Spectrum

**Sources:** [Spectrum design data](https://github.com/adobe/spectrum-design-data), [Token package](https://github.com/adobe/spectrum-design-data/tree/main/packages/tokens), [Component schemas](https://github.com/adobe/spectrum-design-data/tree/main/packages/component-schemas), [Design data specification](https://github.com/adobe/spectrum-design-data/tree/main/packages/design-data-spec).

- **Available definitions:** public token data and component JSON schemas describing properties, enums, and defaults. The repository also includes a broader design data specification.
- **Extraction proposal:** read JSON and schemas directly, preserving modes, scales, references, and component identities. Handle component schemas and token bindings separately, checking whether the selected version actually connects them.
- **Limitations:** active development moved from `spectrum-tokens` to `spectrum-design-data`; the current README distinguishes S2 on the main branch from S1 legacy data. Do not mix S1 and S2. Component schemas alone do not establish complete anatomy, behavior, or accessibility coverage; verify each separately.

### 2.11 Chakra UI v3

**Sources:** [Tokens](https://chakra-ui.com/docs/theming/tokens), [Semantic tokens](https://chakra-ui.com/docs/theming/semantic-tokens), [Slot recipes](https://chakra-ui.com/docs/theming/slot-recipes).

- **Available definitions:** `{ value, description }` objects in `theme.tokens`, conditional `semanticTokens`, and recipes / slot recipes. The structure is influenced by DTCG but is not directly a DTCG 2025.10 file.
- **Extraction proposal:** traverse the token tree, preserving full reference paths and conditions such as `_dark`. Extract slots, base styles, variants, compound variants, default variants, and token bindings separately at the component layer.
- **Limitations:** recipes describe visual combinations, not component state machines. Functions in TypeScript configuration still require a controlled resolver or explicit unresolved records.

### 2.12 Carbon

**Sources:** [Theme overview](https://carbondesignsystem.com/elements/themes/overview/), [Theme code](https://carbondesignsystem.com/elements/themes/code/), [`@carbon/themes`](https://github.com/carbon-design-system/carbon/tree/main/packages/themes).

- **Available definitions:** semantic tokens and themes such as white, g10, g90, and g100. The package provides both JavaScript and Sass inputs; Sass parsing is not the only option.
- **Extraction proposal:** prefer JS exports for default themes and supplement them with documented role descriptions. For custom Sass, use controlled compilation snapshots while preserving mixin / scope information. Record the layer context of layer-related roles separately.
- **Limitations:** resolved JS exports may omit original aliases. Recover dependencies from source declarations rather than inferring references from equal color values. Isolate legacy `ui-*` tokens from newer names by version.

### 2.13 Ant Design

**Source:** [Customize theme and token lifecycle](https://ant.design/docs/react/customize-theme/).

- **Available definitions:** Seed → Map → Alias derivation, composable algorithms, and component token overrides.
- **Extraction proposal:** preserve seeds, algorithm identity / version / order, provider inheritance, and component overrides. Generate sample values through a controlled resolver. Serializable inputs and outputs make suitable fixtures, but intermediate algorithms must not be represented as simple aliases.
- **Limitations:** keep this at P4 research status until an execution model is established. Record dependencies of unknown custom algorithms and leave them unresolved. One `getDesignToken` result is not a complete system definition.

### 2.14 Additional RFC Comparison Samples

These samples do not change the v1 implementation order.

| Sample                          | Official source / availability                                                                                                                                                   | Proposed extraction and value                                                                                                                                                                                   |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Atlassian Design System         | [Color foundations](https://atlassian.design/foundations/color-new/)                                                                                                             | Role, property, emphasis, and state definitions help test semantic classification. Record definitions with evidence, then select versioned code or design assets as value sources                               |
| Apple HIG / system materials    | [Materials](https://developer.apple.com/design/human-interface-guidelines/materials), [Liquid Glass](https://developer.apple.com/documentation/TechnologyOverviews/liquid-glass) | Extract material purpose, foreground / background relationships, environment, and accessibility conditions as capability requirements. Dynamic materials cannot be reduced to a blur value or translucent color |
| TUX manual migration experience | Historical context supplied by the user; no verifiable, publicly citable official definition source was available in this research                                               | A potential manual integration baseline. Further work needs authorized assets and publishable facts; do not invent token schemas from recollection or screenshots                                               |
| LUNA                            | [Color IDs](../../../packages/luna-core/src/theme/color.ts), [Theme fixtures](../../../packages/luna-tokens/src/index.ts)                                                        | The current target vocabulary and local reference. Use it to identify source semantics without target coverage, not to assume coverage of every design system                                                   |

## 3. Theme Token Samples

The comparison starts with how each system divides visual decisions into reusable roles. Complete shadcn and daisyui theme definitions follow, including their non-color tokens, together with complete Material 3 system colors and Material 2 / MUI palettes. The current v1 mapping scope remains colors.

### 3.1 Semantic Model Comparison

The following is our interpretation of the [LUNA token definitions](../../../packages/luna-tokens/README.md), [shadcn theme roles](https://ui.shadcn.com/docs/theming), and [daisyui color roles](https://daisyui.com/docs/colors/). CSS prefixes are omitted so the table compares design vocabulary directly; daisyui v4 and v5 share the color role names shown here.

| Design decision             | LUNA                                                                                                                                               | shadcn                                                                                                                         | daisyui                                                                                                     |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| Organizing principle        | Perceived surface character, content presence, and functional emphasis                                                                             | General visual roles plus separately tunable surface / region contexts                                                         | Brand and status roles shared across components                                                             |
| Surfaces                    | `canvas`, `paper`, `paper-clear`; `paper-veil/film` vary how a surface blends into its environment                                                 | `background`, `card`, `popover`, `sidebar` identify where a surface is used                                                    | `base-100/200/300` provide a shared surface hierarchy                                                       |
| Base surface content        | The `content` series (`content`, `content-2`, `content-muted/subtle/faint/faded`) serves `canvas`, `paper`, and related base surfaces              | `foreground` serves `background`; `card-foreground`, `popover-foreground`, and `sidebar-foreground` serve their named surfaces | `base-content` serves `base-100/200/300`                                                                    |
| Role-specific content       | `primary` → `primary-content`; `secondary` → `secondary-content`; `neutral` and `gradient` also have their own content families and faded variants | `primary`, `secondary`, and `accent` have their own `*-foreground` partners                                                    | Each brand / neutral / status role has its own `*-content` partner                                          |
| Brand and emphasis          | `primary`, `primary-2`, `primary-muted`, `secondary` combine functional emphasis with variations in presence                                       | `primary` and `secondary` express action emphasis; `accent` covers interactive highlights                                      | `primary`, `secondary`, `accent` are distinct brand colors; `neutral` supports less saturated UI            |
| Status and interaction      | Active emphasis appears in `primary-2`; product status and interaction meaning are supplied by the consuming design                                | `destructive` carries danger / error intent; `ring` and `accent` support focus and interaction                                 | `info`, `success`, `warning`, `error` make status explicit across components                                |
| Component / region context  | Recipes bind shared perceptual roles to a card, menu, sidebar, or other composition                                                                | `sidebar-*` adds independent local action, highlight, content, border, and ring roles                                          | Components reuse the same brand / status vocabulary; `data-theme` can scope a whole theme                   |
| Boundaries and transparency | `line` outlines, `rule` separates; `backdrop` isolates context; `faded`, `veil`, and `film` encode different uses of transparency                  | `border` covers outlines and separators; `input` and `ring` distinguish control treatment                                      | The color theme supplies surfaces and role pairs; component styles define borders and interaction treatment |

**The main tradeoff is which decisions stay independent.** LUNA carries fine distinctions in presence across many components. shadcn gives selected contexts their own theme controls. daisyui keeps brand / status choices consistent across component types. These choices overlap: all three have surfaces and functional color pairs. Mapping must preserve the distinctions actually used by a source theme.

### 3.2 LUNA: Perceptual Semantics with Functional Roles

The [token definitions](../../../packages/luna-tokens/README.md) describe perceived qualities shared across components. Content is paired with its surface family: the standalone `content` series serves `canvas`, `paper`, and related base surfaces; `primary`, `secondary`, `neutral`, and `gradient` each have their own content series, such as `primary-content` / `primary-content-faded` and `secondary-content` / `secondary-content-faded`. Presence modifiers vary emphasis within the corresponding family. The examples below come from the local [`luna-light` theme](../../../packages/luna-tokens/src/luna-light.ts).

| Token samples                                | Values                           | Semantic distinction                                                                                            |
| -------------------------------------------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `canvas`, `paper`, `paper-clear`             | `#ffffff`, `#f8f8f8`, `#ffffff`  | Base environment, content surface, and a clear floating surface; equal values do not make roles interchangeable |
| `content`, `content-muted`, `content-subtle` | `#010101`, `#5d5d5d`, `#9e9e9e`  | Content presence and emphasis on canvas / paper base surfaces                                                   |
| `primary`, `primary-content`                 | `#1a1a1a`, `#fafafa`             | Primary functional emphasis and readable content on that color                                                  |
| `secondary`, `secondary-content`             | `#c0c0c0`, `#3c3c3c`             | Supporting accent and its paired content                                                                        |
| `line`, `rule`                               | `rgba(0, 0, 0, 0.17)`, `#e5e5e5` | Outline versus separator, distinguished by purpose rather than line weight                                      |

`paper-clear` can serve both a popover and a sheet through their recipes. LUNA's use of **perceptual** refers to the qualities named by its roles. Color space is a separate representation choice: these local values use hex and RGBA, while other themes below use OKLCH.

### 3.3 shadcn: General Roles Plus Surface and Region Contexts

Here, **v3 / v4 means Tailwind v3 / v4 integration**. Each code block contains a complete theme definition from the identified source, including light and dark values, chart colors, sidebar roles, and radius. The two instances illustrate version-specific token inventories and bindings; their palette choices also differ.

#### Tailwind v3: Complete Documentation-Site Theme

Source: [`apps/www/styles/globals.css` at `shadcn@2.3.0`](https://github.com/shadcn-ui/ui/blob/c8c4027b6b192822ea2952b225ee4760cddedf0d/apps/www/styles/globals.css). The complete theme declaration block contains **32 color tokens and 1 radius token**. Dark mode overrides all colors and inherits `--radius`. The remaining source contains site styling.

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 240 10% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 240 10% 3.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 240 10% 3.9%;
    --primary: 240 5.9% 10%;
    --primary-foreground: 0 0% 98%;
    --secondary: 240 4.8% 95.9%;
    --secondary-foreground: 240 5.9% 10%;
    --muted: 240 4.8% 95.9%;
    --muted-foreground: 240 3.8% 46.1%;
    --accent: 240 4.8% 95.9%;
    --accent-foreground: 240 5.9% 10%;
    --destructive: 0 72.22% 50.59%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 5.9% 90%;
    --input: 240 5.9% 90%;
    --ring: 240 5% 64.9%;
    --radius: 0.5rem;
    --chart-1: 12 76% 61%;
    --chart-2: 173 58% 39%;
    --chart-3: 197 37% 24%;
    --chart-4: 43 74% 66%;
    --chart-5: 27 87% 67%;
    --sidebar-background: 0 0% 98%;
    --sidebar-foreground: 240 5.3% 26.1%;
    --sidebar-primary: 240 5.9% 10%;
    --sidebar-primary-foreground: 0 0% 98%;
    --sidebar-accent: 240 4.8% 95.9%;
    --sidebar-accent-foreground: 240 5.9% 10%;
    --sidebar-border: 220 13% 91%;
    --sidebar-ring: 240 5% 64.9%;
  }

  .dark {
    --background: 240 10% 3.9%;
    --foreground: 0 0% 98%;
    --card: 240 10% 3.9%;
    --card-foreground: 0 0% 98%;
    --popover: 240 10% 3.9%;
    --popover-foreground: 0 0% 98%;
    --primary: 0 0% 98%;
    --primary-foreground: 240 5.9% 10%;
    --secondary: 240 3.7% 15.9%;
    --secondary-foreground: 0 0% 98%;
    --muted: 240 3.7% 15.9%;
    --muted-foreground: 240 5% 64.9%;
    --accent: 240 3.7% 15.9%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 85.7% 97.3%;
    --border: 240 3.7% 15.9%;
    --input: 240 3.7% 15.9%;
    --ring: 240 4.9% 83.9%;
    --chart-1: 220 70% 50%;
    --chart-2: 160 60% 45%;
    --chart-3: 30 80% 55%;
    --chart-4: 280 65% 60%;
    --chart-5: 340 75% 55%;
    --sidebar-background: 240 5.9% 10%;
    --sidebar-foreground: 240 4.8% 95.9%;
    --sidebar-primary: 224.3 76.3% 48%;
    --sidebar-primary-foreground: 0 0% 100%;
    --sidebar-accent: 240 3.7% 15.9%;
    --sidebar-accent-foreground: 240 4.8% 95.9%;
    --sidebar-border: 240 3.7% 15.9%;
    --sidebar-ring: 240 4.9% 83.9%;
  }
}
```

These color values are HSL channels, consumed as `hsl(var(--token))` through `theme.extend.colors`. The sidebar background uses the legacy name `--sidebar-background`; the `sidebar.DEFAULT` color entry resolves it. `--radius` retains its length value. See the [v3 theming convention](https://github.com/shadcn-ui/ui/blob/c8c4027b6b192822ea2952b225ee4760cddedf0d/apps/www/content/docs/theming.mdx).

#### Tailwind v4: Complete Default Neutral Theme

Source: [the default neutral scaffold](https://github.com/shadcn-ui/ui/blob/683a5a9b370acdb7785a0529434e6a3b8c7e0441/apps/v4/content/docs/%28root%29/theming.mdx), checked on 2026-08-28. This contains **31 color tokens and 1 radius token**, with all **31 Tailwind color aliases and 7 derived radius tokens**. Dark mode overrides the colors and inherits `--radius`.

```css
@import "tailwindcss";
@import "shadcn/tailwind.css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);
  --radius-sm: calc(var(--radius) * 0.6);
  --radius-md: calc(var(--radius) * 0.8);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) * 1.4);
  --radius-2xl: calc(var(--radius) * 1.8);
  --radius-3xl: calc(var(--radius) * 2.2);
  --radius-4xl: calc(var(--radius) * 2.6);
}

:root {
  --radius: 0.625rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
  --chart-1: oklch(0.646 0.222 41.116);
  --chart-2: oklch(0.6 0.118 184.704);
  --chart-3: oklch(0.398 0.07 227.392);
  --chart-4: oklch(0.828 0.189 84.429);
  --chart-5: oklch(0.769 0.188 70.08);
  --sidebar: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0.145 0 0);
  --sidebar-primary: oklch(0.205 0 0);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.97 0 0);
  --sidebar-accent-foreground: oklch(0.205 0 0);
  --sidebar-border: oklch(0.922 0 0);
  --sidebar-ring: oklch(0.708 0 0);
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.205 0 0);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.205 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.922 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.556 0 0);
  --chart-1: oklch(0.488 0.243 264.376);
  --chart-2: oklch(0.696 0.17 162.48);
  --chart-3: oklch(0.769 0.188 70.08);
  --chart-4: oklch(0.627 0.265 303.9);
  --chart-5: oklch(0.645 0.246 16.439);
  --sidebar: oklch(0.205 0 0);
  --sidebar-foreground: oklch(0.985 0 0);
  --sidebar-primary: oklch(0.488 0.243 264.376);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.269 0 0);
  --sidebar-accent-foreground: oklch(0.985 0 0);
  --sidebar-border: oklch(1 0 0 / 10%);
  --sidebar-ring: oklch(0.556 0 0);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }

  body {
    @apply bg-background text-foreground;
  }
}
```

Relative to the v3 instance above, this scaffold renames `--sidebar-background` to `--sidebar` and omits `--destructive-foreground`. Record both differences in the versioned inventory. This theme uses OKLCH; upgraded v4 projects can also use complete `hsl(...)` values with `@theme inline`. See the [migration guide](https://ui.shadcn.com/docs/tailwind-v4).

**Semantic reading:** `popover` serves several overlay components, while `sidebar-*` gives one region its own surface, content, actions, and interaction colors. The dark theme above makes that independence visible: `sidebar-primary` is chromatic while global `primary` is neutral. A mapping that merges those roles into one global primary would change this theme. See [shadcn theming](https://ui.shadcn.com/docs/theming).

### 3.4 daisyui: Complete Themes with Brand and Status Roles

**daisyui 4.x pairs with Tailwind v3; daisyui 5.x pairs with Tailwind v4.** The pinned [daisyui 4.12.24 package](https://github.com/saadeghi/daisyui/blob/eac08d2935ecfea26a4f6401c056ab85feee4bbe/package.json) builds against Tailwind `3.4.4`; the official [v5 upgrade guide](https://daisyui.com/docs/upgrade/) migrates both packages together.

#### Tailwind v3 / daisyui 4.12.24: Complete Light Theme

Source: the complete `[data-theme=light]` block from the [published 4.12.24 theme CSS](https://cdn.jsdelivr.net/npm/daisyui@4.12.24/dist/themes.css), reproduced with its original variable names and values. It contains **20 color variables, 9 shape / motion / border variables, and `color-scheme`**.

```css
[data-theme=light] {
    color-scheme: light;
    --in: 72.06% 0.191 231.6;
    --su: 64.8% 0.150 160;
    --wa: 84.71% 0.199 83.87;
    --er: 71.76% 0.221 22.18;
    --pc: 89.824% 0.06192 275.75;
    --ac: 15.352% 0.0368 183.61;
    --inc: 0% 0 0;
    --suc: 0% 0 0;
    --wac: 0% 0 0;
    --erc: 0% 0 0;
    --rounded-box: 1rem;
    --rounded-btn: 0.5rem;
    --rounded-badge: 1.9rem;
    --animation-btn: 0.25s;
    --animation-input: .2s;
    --btn-focus-scale: 0.95;
    --border-btn: 1px;
    --tab-border: 1px;
    --tab-radius: 0.5rem;
    --p: 49.12% 0.3096 275.75;
    --s: 69.71% 0.329 342.55;
    --sc: 98.71% 0.0106 342.55;
    --a: 76.76% 0.184 183.61;
    --n: 32.1785% 0.02476 255.701624;
    --nc: 89.4994% 0.011585 252.096176;
    --b1: 100% 0 0;
    --b2: 96.1151% 0 0;
    --b3: 92.4169% 0.00108 197.137559;
    --bc: 27.8078% 0.029596 256.847952
}
```

**Name notes** ([official mapping](https://github.com/saadeghi/daisyui/blob/eac08d2935ecfea26a4f6401c056ab85feee4bbe/src/theming/colorNames.js)):

- `--p`, `--s`, `--a`, `--n`: primary, secondary, accent, and neutral.
- `--in`, `--su`, `--wa`, `--er`: info, success, warning, and error.
- `--b1`, `--b2`, `--b3`: base-100, base-200, and base-300.
- The suffix `c` means content on that color: `--pc` is primary-content, `--wac` is warning-content, and `--bc` is base-content. Color values are OKLCH channels, consumed as `oklch(var(--p))`, for example.
- `rounded-*` and `tab-radius` control corners; `animation-*` controls durations; `btn-focus-scale` controls button interaction scaling; `border-btn` and `tab-border` control border widths.

These emitted values include authored colors, generated content colors, and defaults. Their provenance is available in the [theme source](https://github.com/saadeghi/daisyui/blob/eac08d2935ecfea26a4f6401c056ab85feee4bbe/src/theming/themes.js), [converter](https://github.com/saadeghi/daisyui/blob/eac08d2935ecfea26a4f6401c056ab85feee4bbe/src/theming/functions.js), and [defaults](https://github.com/saadeghi/daisyui/blob/eac08d2935ecfea26a4f6401c056ab85feee4bbe/src/theming/themeDefaults.js).

#### Tailwind v4 / daisyui v5: Complete Custom Theme

Source: the official daisyui v5 / Tailwind v4 [`mytheme` custom-theme example](https://github.com/saadeghi/daisyui/blob/ae07395d9c27f5b8cef3cb1ff20e12edd3659d6c/packages/docs/src/routes/%28routes%29/docs/themes/%2Bpage.md), checked on 2026-08-28. This complete light-appearance theme declares **28 theme variables: 20 colors and 8 size / shape / effect variables**, plus theme metadata.

```css
@import "tailwindcss";
@plugin "daisyui";
@plugin "daisyui/theme" {
  name: "mytheme";
  default: true; /* set as default */
  prefersdark: false; /* set as default dark mode (prefers-color-scheme:dark) */
  color-scheme: light; /* color of browser-provided UI */

  --color-base-100: oklch(98% 0.02 240);
  --color-base-200: oklch(95% 0.03 240);
  --color-base-300: oklch(92% 0.04 240);
  --color-base-content: oklch(20% 0.05 240);
  --color-primary: oklch(55% 0.3 240);
  --color-primary-content: oklch(98% 0.01 240);
  --color-secondary: oklch(70% 0.25 200);
  --color-secondary-content: oklch(98% 0.01 200);
  --color-accent: oklch(65% 0.25 160);
  --color-accent-content: oklch(98% 0.01 160);
  --color-neutral: oklch(50% 0.05 240);
  --color-neutral-content: oklch(98% 0.01 240);
  --color-info: oklch(70% 0.2 220);
  --color-info-content: oklch(98% 0.01 220);
  --color-success: oklch(65% 0.25 140);
  --color-success-content: oklch(98% 0.01 140);
  --color-warning: oklch(80% 0.25 80);
  --color-warning-content: oklch(20% 0.05 80);
  --color-error: oklch(65% 0.3 30);
  --color-error-content: oklch(98% 0.01 30);

  /* border radius */
  --radius-selector: 1rem;
  --radius-field: 0.25rem;
  --radius-box: 0.5rem;

  /* base sizes */
  --size-selector: 0.25rem;
  --size-field: 0.25rem;

  /* border size */
  --border: 1px;

  /* effects */
  --depth: 1;
  --noise: 0;
}
```

#### daisyui v4 / v5 Comparison

The built-in v4 `light` theme and the v5 `mytheme` example use different palettes. Their common role inventory lets us compare authoring, resolution, and theme scope across versions.

| Dimension                  | daisyui v4 / Tailwind v3                                                                                                             | daisyui v5 / Tailwind v4                                                                                                       |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| Authoring                  | JS theme objects under `daisyui.themes` in `tailwind.config.js`, with `require("daisyui")` as a plugin                               | CSS declarations in `@plugin "daisyui/theme"`                                                                                  |
| Color representation       | Short variables such as `--p` and `--wa` hold OKLCH channels; consumers wrap them in `oklch(...)`                                    | Semantic variables such as `--color-primary` and `--color-warning` hold complete color values                                  |
| Semantic color model       | 20 roles covering base surfaces, brand / neutral, status, and content partners                                                       | The same 20 role names are present; the clearer variable names do not imply a new semantic layer                               |
| Completeness of source     | Authored objects can omit values that the converter derives or fills from defaults                                                   | The displayed custom-theme block explicitly supplies all 28 variables; partial overrides of built-in themes are also supported |
| Non-color theme vocabulary | 9 defaults: `rounded-box/btn/badge`, `animation-btn/input`, `btn-focus-scale`, `border-btn`, `tab-border/radius` (all prefixed `--`) | 8 variables: `radius-selector/field/box`, `size-selector/field`, `border`, `depth`, `noise` (all prefixed `--`)                |
| Theme context              | Theme order determines the default; `darkTheme` controls automatic dark selection; `data-theme` selects a scope                      | `default`, `prefersdark`, and plugin theme flags select defaults; `data-theme` still selects a scope                           |

The brand / status color model continues across these generations. Version-specific adapters handle naming, default generation, and theme selection. The non-color vocabulary changes more substantially: v4 exposes button animation, interaction scale, and tab controls; v5 groups shape and size by selector, field, and box, and adds depth and noise controls. Their behavioral correspondence needs separate review. See the [v4 theme implementation](https://github.com/saadeghi/daisyui/blob/eac08d2935ecfea26a4f6401c056ab85feee4bbe/src/theming/functions.js) and [v5 theme configuration](https://daisyui.com/docs/themes/).

**Semantic reading across both versions:** `base-100/200/300` organize surfaces despite their numeric names. `primary`, `secondary`, `accent`, and `neutral` describe brand / neutral roles; `info`, `success`, `warning`, and `error` describe status. Each of these eight roles has a `-content` partner, while `base-content` serves the base surfaces. Theme selection metadata is separate from these color roles. This remains distinct from LUNA's perceptual semantic / functional foundation and shadcn's mix of general roles with popover / sidebar contexts. See [color roles](https://daisyui.com/docs/colors/).

These roles apply across components: `btn-primary`, for example, uses primary and its content partner. A daisyui `accent` mapping needs brand intent, while a shadcn `accent` mapping needs interaction context.

### 3.5 Material 3: Complete System Color Theme

This example contains the complete **49-role system color scheme in both light and dark modes** from Material Web's `v0.192` token definitions, pinned at commit `cac9767`. It resolves the official role-to-palette aliases against the default reference palette and keeps the original `--md-sys-color-*` names. The `:root` / `.dark` selectors are chosen here to make the two modes easy to apply.

Sources: [system color definitions](https://github.com/material-components/material-web/blob/cac97678831d48d4eb4a606ca50f92673a1dc20c/tokens/versions/v0_192/_md-sys-color.scss), [reference palette](https://github.com/material-components/material-web/blob/cac97678831d48d4eb4a606ca50f92673a1dc20c/tokens/versions/v0_192/_md-ref-palette.scss), and [CSS property names / supported inventory](https://github.com/material-components/material-web/blob/cac97678831d48d4eb4a606ca50f92673a1dc20c/tokens/_md-sys-color.scss). This is a resolved baseline color snapshot. Material Web defines typography, shape, motion, elevation, and state in [separate token modules](https://github.com/material-components/material-web/tree/cac97678831d48d4eb4a606ca50f92673a1dc20c/tokens); those modules remain outside this color example's scope.

```css
/* Derived from Material Web token definitions.
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

:root {
  --md-sys-color-background: #fef7ff;
  --md-sys-color-error: #b3261e;
  --md-sys-color-error-container: #f9dedc;
  --md-sys-color-inverse-on-surface: #f5eff7;
  --md-sys-color-inverse-primary: #d0bcff;
  --md-sys-color-inverse-surface: #322f35;
  --md-sys-color-on-background: #1d1b20;
  --md-sys-color-on-error: #fff;
  --md-sys-color-on-error-container: #410e0b;
  --md-sys-color-on-primary: #fff;
  --md-sys-color-on-primary-container: #21005d;
  --md-sys-color-on-primary-fixed: #21005d;
  --md-sys-color-on-primary-fixed-variant: #4f378b;
  --md-sys-color-on-secondary: #fff;
  --md-sys-color-on-secondary-container: #1d192b;
  --md-sys-color-on-secondary-fixed: #1d192b;
  --md-sys-color-on-secondary-fixed-variant: #4a4458;
  --md-sys-color-on-surface: #1d1b20;
  --md-sys-color-on-surface-variant: #49454f;
  --md-sys-color-on-tertiary: #fff;
  --md-sys-color-on-tertiary-container: #31111d;
  --md-sys-color-on-tertiary-fixed: #31111d;
  --md-sys-color-on-tertiary-fixed-variant: #633b48;
  --md-sys-color-outline: #79747e;
  --md-sys-color-outline-variant: #cac4d0;
  --md-sys-color-primary: #6750a4;
  --md-sys-color-primary-container: #eaddff;
  --md-sys-color-primary-fixed: #eaddff;
  --md-sys-color-primary-fixed-dim: #d0bcff;
  --md-sys-color-scrim: #000;
  --md-sys-color-secondary: #625b71;
  --md-sys-color-secondary-container: #e8def8;
  --md-sys-color-secondary-fixed: #e8def8;
  --md-sys-color-secondary-fixed-dim: #ccc2dc;
  --md-sys-color-shadow: #000;
  --md-sys-color-surface: #fef7ff;
  --md-sys-color-surface-bright: #fef7ff;
  --md-sys-color-surface-container: #f3edf7;
  --md-sys-color-surface-container-high: #ece6f0;
  --md-sys-color-surface-container-highest: #e6e0e9;
  --md-sys-color-surface-container-low: #f7f2fa;
  --md-sys-color-surface-container-lowest: #fff;
  --md-sys-color-surface-dim: #ded8e1;
  --md-sys-color-surface-tint: #6750a4;
  --md-sys-color-surface-variant: #e7e0ec;
  --md-sys-color-tertiary: #7d5260;
  --md-sys-color-tertiary-container: #ffd8e4;
  --md-sys-color-tertiary-fixed: #ffd8e4;
  --md-sys-color-tertiary-fixed-dim: #efb8c8;
}

.dark {
  --md-sys-color-background: #141218;
  --md-sys-color-error: #f2b8b5;
  --md-sys-color-error-container: #8c1d18;
  --md-sys-color-inverse-on-surface: #322f35;
  --md-sys-color-inverse-primary: #6750a4;
  --md-sys-color-inverse-surface: #e6e0e9;
  --md-sys-color-on-background: #e6e0e9;
  --md-sys-color-on-error: #601410;
  --md-sys-color-on-error-container: #f9dedc;
  --md-sys-color-on-primary: #381e72;
  --md-sys-color-on-primary-container: #eaddff;
  --md-sys-color-on-primary-fixed: #21005d;
  --md-sys-color-on-primary-fixed-variant: #4f378b;
  --md-sys-color-on-secondary: #332d41;
  --md-sys-color-on-secondary-container: #e8def8;
  --md-sys-color-on-secondary-fixed: #1d192b;
  --md-sys-color-on-secondary-fixed-variant: #4a4458;
  --md-sys-color-on-surface: #e6e0e9;
  --md-sys-color-on-surface-variant: #cac4d0;
  --md-sys-color-on-tertiary: #492532;
  --md-sys-color-on-tertiary-container: #ffd8e4;
  --md-sys-color-on-tertiary-fixed: #31111d;
  --md-sys-color-on-tertiary-fixed-variant: #633b48;
  --md-sys-color-outline: #938f99;
  --md-sys-color-outline-variant: #49454f;
  --md-sys-color-primary: #d0bcff;
  --md-sys-color-primary-container: #4f378b;
  --md-sys-color-primary-fixed: #eaddff;
  --md-sys-color-primary-fixed-dim: #d0bcff;
  --md-sys-color-scrim: #000;
  --md-sys-color-secondary: #ccc2dc;
  --md-sys-color-secondary-container: #4a4458;
  --md-sys-color-secondary-fixed: #e8def8;
  --md-sys-color-secondary-fixed-dim: #ccc2dc;
  --md-sys-color-shadow: #000;
  --md-sys-color-surface: #141218;
  --md-sys-color-surface-bright: #3b383e;
  --md-sys-color-surface-container: #211f26;
  --md-sys-color-surface-container-high: #2b2930;
  --md-sys-color-surface-container-highest: #36343b;
  --md-sys-color-surface-container-low: #1d1b20;
  --md-sys-color-surface-container-lowest: #0f0d13;
  --md-sys-color-surface-dim: #141218;
  --md-sys-color-surface-tint: #d0bcff;
  --md-sys-color-surface-variant: #49454f;
  --md-sys-color-tertiary: #efb8c8;
  --md-sys-color-tertiary-container: #633b48;
  --md-sys-color-tertiary-fixed: #ffd8e4;
  --md-sys-color-tertiary-fixed-dim: #efb8c8;
}
```

- `primary`, `secondary`, `tertiary`, and `error` each have `on-*` content roles and a separate `*-container` / `on-*-container` pair. Surface containers share `on-surface` and `on-surface-variant` content roles.
- The `*-fixed` families keep the same values across these two modes, including their content roles. The sample also retains `background`, `on-background`, and `surface-variant` because they are part of this pinned inventory.
- For extraction, retain the source aliases alongside these resolved values: light `primary` references `primary40`, while dark `primary` references `primary80`. Dynamic color generation needs its own versioned algorithm and input context.

### 3.6 Material 2: Complete MUI Default Palettes

Material UI implements Material Design 2 and supplies its own palette model. This sample pins **`@mui/material@9.4.0`**; the package version and the Material design-system generation are independent. See [MUI's stated design baseline](https://mui.com/material-ui/getting-started/) and the [published package](https://www.npmjs.com/package/@mui/material/v/9.4.0).

The two JSON blocks contain **every serializable field** returned by the pinned `createPalette({ mode: "light" })` and `createPalette({ mode: "dark" })` defaults. They preserve the native object paths and resolved values. Light contains **52 colors** and dark **53 colors**; each also contains **5 action opacities**, `contrastThreshold`, `tonalOffset`, and `mode`. The two callable fields, `getContrastText` and `augmentColor`, stay in the source implementation. Typography, spacing, shadows, and component configuration belong to other parts of the MUI theme.

Sources: [palette factory](https://github.com/mui/material-ui/blob/809a7717b4c050ba3f69b75300689f07c050a16e/packages/mui-material/src/styles/createPalette.js), [palette types](https://github.com/mui/material-ui/blob/809a7717b4c050ba3f69b75300689f07c050a16e/packages/mui-material/src/styles/createPalette.d.ts), [reference colors](https://github.com/mui/material-ui/tree/809a7717b4c050ba3f69b75300689f07c050a16e/packages/mui-material/src/colors), and [color resolution functions](https://github.com/mui/material-ui/blob/809a7717b4c050ba3f69b75300689f07c050a16e/packages/mui-system/src/colorManipulator/colorManipulator.js), at the `v9.4.0` release commit `809a771`. The snapshots below are derived from these [MIT-licensed sources](https://github.com/mui/material-ui/blob/809a7717b4c050ba3f69b75300689f07c050a16e/LICENSE), copyright 2014 Call-Em-All.

#### Light Palette

```json
{
  "common": { "black": "#000", "white": "#fff" },
  "mode": "light",
  "primary": { "main": "#1976d2", "light": "#42a5f5", "dark": "#1565c0", "contrastText": "#fff" },
  "secondary": { "main": "#9c27b0", "light": "#ba68c8", "dark": "#7b1fa2", "contrastText": "#fff" },
  "error": { "main": "#d32f2f", "light": "#ef5350", "dark": "#c62828", "contrastText": "#fff" },
  "warning": { "main": "#ed6c02", "light": "#ff9800", "dark": "#e65100", "contrastText": "#fff" },
  "info": { "main": "#0288d1", "light": "#03a9f4", "dark": "#01579b", "contrastText": "#fff" },
  "success": { "main": "#2e7d32", "light": "#4caf50", "dark": "#1b5e20", "contrastText": "#fff" },
  "grey": {
    "50": "#fafafa", "100": "#f5f5f5", "200": "#eeeeee", "300": "#e0e0e0", "400": "#bdbdbd",
    "500": "#9e9e9e", "600": "#757575", "700": "#616161", "800": "#424242", "900": "#212121",
    "A100": "#f5f5f5", "A200": "#eeeeee", "A400": "#bdbdbd", "A700": "#616161"
  },
  "contrastThreshold": 3,
  "tonalOffset": 0.2,
  "text": {
    "primary": "rgba(0, 0, 0, 0.87)", "secondary": "rgba(0, 0, 0, 0.6)",
    "disabled": "rgba(0, 0, 0, 0.38)"
  },
  "divider": "rgba(0, 0, 0, 0.12)",
  "background": { "paper": "#fff", "default": "#fff" },
  "action": {
    "active": "rgba(0, 0, 0, 0.54)", "hover": "rgba(0, 0, 0, 0.04)", "hoverOpacity": 0.04,
    "selected": "rgba(0, 0, 0, 0.08)", "selectedOpacity": 0.08, "disabled": "rgba(0, 0, 0, 0.26)",
    "disabledBackground": "rgba(0, 0, 0, 0.12)", "disabledOpacity": 0.38,
    "focus": "rgba(0, 0, 0, 0.12)", "focusOpacity": 0.12, "activatedOpacity": 0.12
  }
}
```

#### Dark Palette

```json
{
  "common": { "black": "#000", "white": "#fff" },
  "mode": "dark",
  "primary": {
    "main": "#90caf9", "light": "#e3f2fd", "dark": "#42a5f5", "contrastText": "rgba(0, 0, 0, 0.87)"
  },
  "secondary": {
    "main": "#ce93d8", "light": "#f3e5f5", "dark": "#ab47bc", "contrastText": "rgba(0, 0, 0, 0.87)"
  },
  "error": { "main": "#f44336", "light": "#e57373", "dark": "#d32f2f", "contrastText": "#fff" },
  "warning": {
    "main": "#ffa726", "light": "#ffb74d", "dark": "#f57c00", "contrastText": "rgba(0, 0, 0, 0.87)"
  },
  "info": {
    "main": "#29b6f6", "light": "#4fc3f7", "dark": "#0288d1", "contrastText": "rgba(0, 0, 0, 0.87)"
  },
  "success": {
    "main": "#66bb6a", "light": "#81c784", "dark": "#388e3c", "contrastText": "rgba(0, 0, 0, 0.87)"
  },
  "grey": {
    "50": "#fafafa", "100": "#f5f5f5", "200": "#eeeeee", "300": "#e0e0e0", "400": "#bdbdbd",
    "500": "#9e9e9e", "600": "#757575", "700": "#616161", "800": "#424242", "900": "#212121",
    "A100": "#f5f5f5", "A200": "#eeeeee", "A400": "#bdbdbd", "A700": "#616161"
  },
  "contrastThreshold": 3,
  "tonalOffset": 0.2,
  "text": {
    "primary": "#fff", "secondary": "rgba(255, 255, 255, 0.7)",
    "disabled": "rgba(255, 255, 255, 0.5)", "icon": "rgba(255, 255, 255, 0.5)"
  },
  "divider": "rgba(255, 255, 255, 0.12)",
  "background": { "paper": "#121212", "default": "#121212" },
  "action": {
    "active": "#fff", "hover": "rgba(255, 255, 255, 0.08)", "hoverOpacity": 0.08,
    "selected": "rgba(255, 255, 255, 0.16)", "selectedOpacity": 0.16,
    "disabled": "rgba(255, 255, 255, 0.3)", "disabledBackground": "rgba(255, 255, 255, 0.12)",
    "disabledOpacity": 0.38, "focus": "rgba(255, 255, 255, 0.12)", "focusOpacity": 0.12,
    "activatedOpacity": 0.24
  }
}
```

- `primary`, `secondary`, `error`, `warning`, `info`, and `success` each expose `main`, `light`, `dark`, and `contrastText`. Here `light` / `dark` are variants within a role; `mode` selects the overall appearance.
- `text.primary`, `text.secondary`, and `text.disabled` describe content on base surfaces such as `background.default` and `background.paper`. `primary.contrastText` is the content partner of `primary.main`. The extra `text.icon` in dark mode is retained from the source output.
- `action` records interaction-state colors and opacities. Preserve RGBA values and numeric opacities separately. `common` and `grey` retain reference colors within the native palette structure.
- `contrastThreshold: 3` and `tonalOffset: 0.2` record default generation inputs. The sample supplies all resolved role colors, so consuming it requires no execution of MUI's derivation functions.

**Mapping boundary:** extract these data fields while retaining their source paths and mode. For LUNA, `text.primary` is a base-surface content candidate; `primary.main` / `primary.contrastText` need review as a functional pair. Preserve status intent separately. Evaluation of `sx`, theme callbacks, responsive rules, component overrides, and CSS-variable generation remains outside this palette comparison.

### 3.7 Implications for Mapping to LUNA

Expanding daisyui `--pc` to `primary-content` is a deterministic lookup. Assigning that role to a LUNA token requires its intended use, surrounding surface, and theme context. The following cases are mapping proposals for review:

| Case                    | Candidate correspondence                                                                                         | Consequence for the contract                                                                                                                                                |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| shadcn card and popover | `card` → `paper`; `popover` → `paper-clear`; their foregrounds may both use `content`                            | Surface differences fit separate LUNA roles. If the source foregrounds differ, one global `content` value cannot preserve both; retain their contexts or report the loss    |
| shadcn borders          | Shared `border` may supply both LUNA `line` and `rule`                                                           | One source value can populate two target roles. The component bindings must still distinguish outlining from separating regions                                             |
| Content emphasis        | For canvas / paper base surfaces, `muted-foreground` may supply `content-muted`                                  | LUNA also distinguishes `content-2`, `content-subtle`, `content-faint`, and `content-faded`. Filling those requires additional evidence or a reviewed derivation policy     |
| daisyui warning         | Retain `warning` / `warning-content` as a status pair; map the surrounding surface and content treatment to LUNA | Status meaning and its color pairing need an explicit application-level realization or extension. Reusing global LUNA `primary` would also affect unrelated primary actions |

This gives the comparison a practical use: identify where shared roles transfer directly, where source contexts must stay independent, and where LUNA's finer perceptual vocabulary needs additional definition. Review both preserved intent and resolved appearance before accepting a mapping.

## 4. How Design Tools Define Design Tokens

### 4.1 No Single Native Storage Model

A design token is a concept; variables, styles, JSON, and theme configuration are different representations. A reusable value does not necessarily express design intent: `blue.500` and `action.primary.background` may share a color, but only the latter explicitly describes its purpose.

Storage interoperability and semantic positioning are separate questions. LUNA's perceptual semantic / functional layer is already established; extraction must preserve the source distinctions needed to map into it, as illustrated in Section 3.7.

For this project, extraction should separately record at least **identity, type, value / expression, reference, context, description, binding, and provenance**. Each adapter should identify which fields the source supplies and which require additional evidence.

| Tool / representation   | Native definition                                                                                                                                            | Proposed extraction                                                                                                         | Important distinction                                                                                                                                      |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Figma Variables         | Variables belong to collections; `resolvedType` is `COLOR`, `FLOAT`, `STRING`, or `BOOLEAN`; `valuesByMode` stores values or variable aliases for each mode  | Variables API or an authorized Plugin API, including collections, modes, IDs, descriptions, scopes, and code syntax         | `FLOAT` alone does not identify a length, opacity, or other number. The project defines the business meaning of each mode                                  |
| Figma Styles            | Composite Text / Paint / Effect styles can contain multiple properties and variable bindings                                                                 | Read style data separately and trace variable references within it                                                          | Variables do not represent complete typography, shadows, or gradients. Exporting only variables misses composite styles                                    |
| Tokens Studio for Figma | JSON token trees; legacy format uses `value/type`, while the DTCG option uses `$value/$type`; sets, themes, and tool extensions provide additional structure | Prefer original JSON and theme / set metadata, then collect bindings synchronized to Figma                                  | Selecting DTCG format does not establish 2025.10 compatibility for every tool type, expression, or theme field. Additional type conversion may be required |
| Penpot                  | Native tokens, references, sets, and theme groups, with JSON exchange                                                                                        | Read JSON, set order, theme combinations, and canvas bindings                                                               | Official examples include tool metadata such as `$themes` and `$metadata`. A `$value` prefix does not establish that the whole file conforms to DTCG       |
| Sketch                  | Color Variables, Text Styles, and Layer Styles                                                                                                               | Official exports provide color CSS / JSON and Text / Layer Styles JSON                                                      | Documentation identifies the color JSON as Style Dictionary format. Inspect the actual export schema rather than assuming DTCG 2025.10                     |
| Framer                  | Project Color Styles and Text Styles, plus component variables / variants                                                                                    | Plugin APIs such as `getColorStyles()` and `getTextStyles()`, preserving style IDs, theme values, and typography conditions | Not all component variables are design tokens. Published CSS cannot reconstruct all design assets and references                                           |

Sources: [Figma variable types](https://developers.figma.com/docs/rest-api/variables-types/), [Figma styles API](https://developers.figma.com/docs/plugins/api/figma/), [Tokens Studio format](https://docs.tokens.studio/manage-settings/token-format), [Tokens Studio themes](https://docs.tokens.studio/manage-themes/themes-overview), [Penpot tokens](https://help.penpot.app/user-guide/design-systems/design-tokens/), [Penpot JSON examples](https://penpot.app/blog/a-practical-guide-to-the-design-tokens-json-format/), [Sketch export](https://www.sketch.com/docs/developer-handoff/export/), [Framer styles API](https://www.framer.com/developers/styles).

**Access limitations:** Figma Variables REST endpoints have organization eligibility and permission requirements, and the published endpoint omits complete mode information. A design file link does not guarantee access to its full variable definitions. Confirm authorization and available access paths first; request an export from the asset owner when necessary rather than bypassing restrictions. See [Figma Variables endpoints](https://developers.figma.com/docs/rest-api/variables-endpoints/).

### 4.2 DTCG Standardizes Exchange Representation

DTCG 2025.10 Format defines JSON token types, values, references, groups, and extensions. Colors include color space information, dimensions carry units, and typography / shadows can be composite values. This minimal example is illustrative, not an official token definition from a design system:

```json
{
  "palette": {
    "ink": {
      "$type": "color",
      "$value": {
        "colorSpace": "srgb",
        "components": [0.1, 0.1, 0.1],
        "alpha": 1
      }
    }
  },
  "content": {
    "default": {
      "$type": "color",
      "$value": "{palette.ink}",
      "$description": "Default readable content on the base surface."
    }
  },
  "spacing": {
    "compact": {
      "$type": "dimension",
      "$value": { "value": 8, "unit": "px" }
    }
  }
}
```

Group names do not automatically establish semantic categories. Format does not prescribe which LUNA role corresponds to Material `primary`. The separate Resolver Module provides sets, modifiers, and resolution order for contextual composition. DTCG therefore has a context model, but it does not execute arbitrary design system runtime algorithms. See [Format 2025.10](https://www.designtokens.org/tr/2025.10/format/) and [Resolver 2025.10](https://www.designtokens.org/tr/2025.10/resolver/).

### 4.3 Different Representations of the Same Concept

These simplified examples follow the corresponding tools' field structures but use illustrative names and values. They are not complete export files.

```text
Figma Variable
  name: content/default
  resolvedType: COLOR
  valuesByMode[light]: VARIABLE_ALIAS -> primitive variable ID
  valuesByMode[dark]:  VARIABLE_ALIAS -> another primitive variable ID

Tokens Studio legacy token
  content.default: { type: "color", value: "{palette.ink}" }

DTCG token
  content.default: { $type: "color", $value: "{palette.ink}" }

CSS theme
  --content-default: var(--palette-ink)
  context: selector + media condition + layer + source order

TypeScript theme
  semanticTokens.colors.content.value:
    base: "{colors.ink}"
    _dark: "{colors.paper}"
```

**Integration must preserve resolution rules.** Figma aliases point to IDs, CSS `var()` can inherit or use fallbacks, and Chakra references are interpreted by its theme system. A shared representation must retain those evaluation semantics. For the CSS and TypeScript mechanisms, see [Tailwind theme variables](https://tailwindcss.com/docs/theme) and [Chakra semantic tokens](https://chakra-ui.com/docs/theming/semantic-tokens).

### 4.4 Where Style Dictionary Fits

Style Dictionary is a token transformation build tool. It handles token trees, references, and platform transforms. Its parsing and output capabilities may be reusable, while semantic correspondence, target capability gaps, and design rationale still need to be defined by this project. See [Style Dictionary token model](https://styledictionary.com/info/tokens/).

## 5. Extracting Structured Schemas and Definitions

### 5.1 Distinguish Schema, Definition, and Snapshot

| Artifact          | Meaning                                                                | Examples                                                                       |
| ----------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Schema            | Which fields, types, and relationships are valid                       | DTCG format, Spectrum component JSON schema, TS token interface                |
| Definition        | A system's actual roles, references, rules, contexts, and intended use | An alias definition, a recipe, the input contract of a dynamic color algorithm |
| Resolved snapshot | Values evaluated under a declared context and version                  | Material colors for a particular seed, dark mode, and contrast                 |

**Proposed preference order:** official structured definitions → official source / types → official documentation → authorized design tool exports. Use screenshots as appearance validation evidence. When code and design assets disagree, record the conflict and ask maintainers to select the authoritative source for that version rather than merging them silently.

Structured extraction also has different levels: CSS / TS ASTs can extract declarations reliably without establishing their meaning. Documentation can inform role / intent extraction, but agent inference should only produce candidates for review. Do not automatically label matching names, equal colors, or similar visual effects as semantic equivalents.

### 5.2 Proposed Collection Fields

The following fields are proposed for schema review.

| Layer                         | Proposed fields                                                                                                           | Purpose                                                                                                |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Source manifest               | system, release / commit, platform, source URL / path, locator, content hash, retrievedAt, license / access notes         | Reproduce the input and distinguish provenance from permission to use it                               |
| Token definition              | stable source ID, original name / path, type, raw value, references, description, scope                                   | Preserve identity and evidence instead of retaining only resolved values                               |
| Context / resolver            | theme, mode, state, density, platform, contrast, inheritance, precedence, resolver ID / version / parameters              | Preserve variation and evaluation rules without requiring every source to support every dimension      |
| Semantic mapping              | source roles, target roles, context mapping, exact / derived / unsupported, transform, rationale, evidence, review status | Separate judgment from extraction; allow many-to-one, one-to-many, and partially defined relationships |
| Component definition, later   | identity, anatomy / slots, variants, states, token bindings, behavior, accessibility                                      | Avoid treating a visual recipe as a complete component contract                                        |
| Capability requirement, later | experience intent, feature cluster, candidate realizations, constraints, fallback, verification evidence                  | Use real systems to assess Lynx capabilities rather than copying browser CSS support tables            |

`exact / derived / unsupported` describes mapping; `resolved / unresolved` describes evaluation; `reviewed / proposed` describes evidence review. Do not combine them into one status: a semantic contract can be established while its value remains unresolved in the current environment.

### 5.3 From Extraction to Consumable Artifacts

```text
Versioned sources + source documentation
                 |
         Source-specific adapters
                 |
   Normalized definitions + reference graph + contexts
                 |
      Reviewed semantic / context mappings
                 |
         Resolution + validation report
                 |
     +-----------+------------------+
     |           |                  |
 LUNA theme   DESIGN.md         Design Skills
 + fixtures   + rationale       + recipes / constraints
```

Prepare a minimal extraction record for each system: manifest, normalized definitions, mapping records, context fixtures, diagnostics, and source notes. Generic parsers must not execute arbitrary JS configuration or algorithms. Use explicitly allowed, pinned resolvers or snapshots supplied by the caller, and retain unresolved entries in the report.

Agent artifacts are different projections of the same reviewed definitions. DESIGN.md provides visual identity, tokens, and rationale; Design Skills add selection rules, component composition, state handling, counterexamples, and Lynx limitations. Generated artifacts must retain source versions and unsupported cases. Do not present inference as an upstream specification or claim complete semantic integration from a single export.

### 5.4 Validation and Coverage Proposals

- **Data integrity:** compare extracted and unresolved counts against the source inventory; detect duplicate IDs, broken references, cycles, and type conflicts. Include positive and negative fixtures for context inheritance and precedence.
- **Semantic coverage:** report exact, derived, and unsupported mappings for each target `LunaColorId`. Separately list source semantics without targets. Filling gaps with defaults must not count as complete coverage.
- **Context coverage:** declare the test matrix, covering at least light / dark initially and later adding scope, state, contrast, and platform. Passing sampled cases does not establish exhaustive runtime coverage.
- **Implementation coverage:** count “extractable,” “mappable,” “expressible in Lynx,” and “verified on device” separately. Color conversion does not establish support for behavior, accessibility, or dynamic materials.
- **Agent artifact quality:** compare generated results on fixed tasks, checking token references, component states, and semantic constraints. People should review the design rationale and visual quality.

The current [LUNA color IDs](../../../packages/luna-core/src/theme/color.ts) leave `error`, `warning`, and `focus-ring` intent to consuming designs. For each source role, record the semantic intent, the candidate LUNA treatment, and any additional realization needed. Report scope differences, missing mappings, and unsupported Lynx behavior separately. Section 3.7 illustrates the consequences for status colors, scoped foregrounds, and content emphasis.

## 6. Next Steps and Unverified Areas

1. Pin shadcn / daisyui fixtures for Tailwind v3 and v4. Validate extraction, mapping, and diagnostics against the current color vocabulary without expanding v1 to components.
2. Use HeroUI and Tamagui to test whether the schema is constrained by CSS assumptions. Consult Spectrum schemas early when reviewing a component model, without committing to its implementation yet.
3. Define context / resolver contracts separately before evaluating Material dynamic color and Ant Design algorithms. Preserve data that cannot be resolved or mapped.
4. Generate a LUNA theme, DESIGN.md, and an experimental Design Skill from the same reviewed mappings, then compare the information each preserves or loses.
5. Have maintainers confirm semantic correspondence, permitted use of design assets, and the RFC's strategic framing before promoting validated decisions into a formal interop contract.

**Research verification scope:** the research covered the three repository documents, local color definitions, related discussions, official documentation, public repositories, and tool APIs. It did not execute external extraction adapters, read restricted design files, or verify cross-tool round trips or Lynx device behavior. Online documentation and `main` / `master` links can change; formal fixtures must pin releases / commits and content hashes. The extraction and mapping approaches in this report remain proposals.
