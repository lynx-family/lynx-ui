# Design-System Rendering Foundations

<!-- cspell:words backface CSSOM CSSWG Flexbox grayscale layerize WebRender -->

## Status

This document proposes a research path for understanding the rendering
semantics behind design systems across the Web platform, Tailwind CSS, Figma,
and Lynx. It complements the token inventory in [mapping.md](./mapping.md) and
the adapter work in [detailed-design.md](./detailed-design.md). Within the
[minimal design-system model](./design-doc.md#a-minimal-model), it studies the
Composition layer and its realization substrate.

The first pass should build a comparative vocabulary and executable fixtures.
It should delay a canonical schema until the same cases have been observed in
multiple systems.

## 1. Why Rendering Semantics Belong in Design-System Interop

A token such as `color.primary` describes a design role. The rendered result
also depends on where and how that color participates in the scene:

- a solid paint can carry its own alpha;
- a node can apply opacity to the combined result of multiple paints and
  children;
- a clipping path can constrain geometry;
- a mask can produce continuously varying coverage;
- a blend mode can make the same foreground color produce different pixels on
  different backdrops;
- filters, group boundaries, stacking order, and color spaces can further
  change the result.

Two screenshots can look identical while their source semantics differ. Those
differences become visible when the backdrop changes, the node animates, a
child is added, or the design is translated to another renderer.

Design-system interoperability therefore needs two connected graphs:

1. **Token graph**: semantic roles, aliases, modes, values, and provenance.
2. **Rendering-operation graph**: geometry, paints, effects, clipping, masking,
   grouping, blending, compositing, and output conditions.

The token graph explains design intent. The operation graph explains how that
intent becomes pixels. A component recipe connects both graphs to component
anatomy, state, and behavior.

## 2. A Working Rendering Pipeline

Use the following sequence as a comparison model. Individual engines can
optimize or fuse stages while preserving the specified result.

```text
design roles and component state
  -> resolve variables, modes, aliases, and contextual values
  -> compute layout, geometry, and coordinate spaces
  -> create paint sources: colors, gradients, images, strokes, and text
  -> apply local effects and filters
  -> apply clipping and masking
  -> establish groups and isolation boundaries
  -> blend and composite with the backdrop
  -> convert color and rasterize for the output surface
```

The exact ordering matters. CSS Masking defines filter effects, clipping,
masking, and opacity as ordered operations. CSS Compositing and Blending
defines how elements form groups and interact with a backdrop. These rules are
more useful for interop than a flat list of similarly named properties.

### 2.1 Terms to Keep Separate

| Concept | Research definition | Why the distinction matters |
| --- | --- | --- |
| Color | Numeric color in a color space, optionally with alpha | A color value does not describe geometry, layering, or a paint stack. |
| Paint | A visible source applied to geometry, such as a solid color, gradient, image, or shader | Figma can attach several paints to one node; one CSS color declaration cannot preserve that structure. |
| Paint alpha | Transparency carried by an individual paint or color | It affects that paint before later group operations. |
| Node or group opacity | Opacity applied to a node's combined rendered result | Flattening it into every child changes overlap and compositing behavior. |
| Clip | A geometric coverage boundary, normally hard except for edge antialiasing | It retains a path-like inclusion rule. |
| Mask | Coverage derived from alpha, luminance, or another image-like source | It can express partial visibility across the masked area. |
| Blend mode | A function combining source and backdrop colors | Its result depends on backdrop content and group isolation. |
| Compositing operator | A rule controlling how source and destination coverage combine | Porter-Duff operators encode placement relationships beyond color blending. |
| Filter or effect | An operation over an image or backdrop, such as blur or shadow | Operation order and the affected input region are part of its meaning. |
| Resolved pixel | A final output sample for one scene and output condition | It is evidence for validation and cannot recover aliases, groups, or authoring intent. |

### 2.2 A Minimal Opacity Example

These two constructions can render the same isolated rectangle:

```css
.paint-alpha {
  background: rgb(255 0 0 / 50%);
}

.group-opacity {
  background: rgb(255 0 0);
  opacity: 0.5;
}
```

They diverge after the element gains multiple backgrounds, overlapping
children, effects, or a blend mode. An extractor should record the placement
of opacity in the source structure and let a target-specific mapper decide
whether a simplification is safe.

## 3. API Families to Compare

The Web platform offers several rendering models. They form a useful reference
vocabulary, while the future canonical representation should remain
renderer-neutral.

| System | Scene model | Paint and effects | Clip and mask | Blend and composite | Best at / weak at | Extraction consequence |
| --- | --- | --- | --- | --- | --- | --- |
| CSS and DOM | Retained element tree plus cascade, inheritance, layout, stacking contexts, and pseudo-elements | CSS properties, backgrounds, borders, shadows, filters, and generated content | Overflow clipping, `clip-path`, CSS masks, and SVG references | `opacity`, `mix-blend-mode`, `background-blend-mode`, `isolation`, and compositing rules | **Best at:** semantic documents and application UI, responsive layout, rich text, accessibility, and browser-native interaction. **Weak at:** deterministic paint-level control, custom pixel algorithms, and recovering authoring structure from resolved output. | Capture declarations, selectors, conditions, layers, inheritance, and DOM context. Computed style alone loses aliases and inactive contexts. |
| SVG | Retained vector scene graph | Fill and stroke paint, gradients, patterns, filters, and markers | `<clipPath>` and `<mask>` with explicit coordinate systems | Element and group opacity plus CSS/SVG compositing | **Best at:** scalable icons, diagrams, charts, retained geometry, DOM events, and reusable resources addressable through the DOM. **Weak at:** dense pixel processing, general application layout, and scenes with very large, rapidly mutating node counts. | Preserve referenced resources, units, transforms, and group structure. |
| Canvas 2D | Immediate drawing commands applied through a mutable drawing state | Fill and stroke styles, gradients, patterns, shadows, filters, images, and text | Path clipping; masks are usually expressed through offscreen canvases and compositing | `globalAlpha` and `globalCompositeOperation` | **Best at:** direct custom 2D drawing, procedural graphics, charts, image operations, and frame-by-frame rendering. **Weak at:** retained semantics, accessibility, automatic layout and hit testing, incremental scene updates, and post-hoc extraction. | A bitmap has already discarded the command sequence. Extraction needs an instrumented command stream or an application-level scene description. |
| WebGL | Programmable GPU pipeline using buffers, textures, framebuffer objects, shaders, and explicit state | Application-defined shader programs and texture inputs | Scissor, stencil, depth, discard logic, alpha textures, and multipass rendering | Blend functions, equations, framebuffer formats, and shader logic | **Best at:** high-throughput custom 2D and 3D rendering, shaders, large scenes, multipass effects, and explicit GPU control. **Weak at:** text and layout, accessibility, DOM interaction, high-level design semantics, and straightforward authoring and debugging. | Design meaning lives in application conventions. Capture shader/material metadata, uniforms, resources, draw order, and passes alongside pixel validation. |
| Figma | Retained document tree of typed nodes | Ordered paint arrays, strokes, effects, images, videos, and emerging paint types | `clipsContent`; mask nodes with vector, alpha, or luminance modes | Paint, effect, and node blend modes; node opacity; group pass-through behavior | **Best at:** editable design authoring, hierarchy, components, variables and modes, multi-paint styling, and collaboration. **Weak at:** reproducing browser cascade and layout, runtime interaction and accessibility, and expressing programmable graphics outside its document model. | Export nodes, sibling order, paints, effects, bindings, modes, and group boundaries. A flattened image is supplementary evidence. |

### 3.1 Tutorials, Comparisons, and Engineering Research

Use a small corpus of first-party material. Tutorials teach each API's working
model, direct comparisons expose selection criteria, and renderer architecture
articles explain how declarative input becomes pixels.

#### Tutorials

| Resource | What it teaches | Suggested exercise |
| --- | --- | --- |
| [MDN: Drawing Graphics](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Client-side_APIs/Drawing_graphics) | A short map across Canvas 2D, SVG, and WebGL | Reproduce one simple shape in all three APIs and compare retained structure, event handling, and redraw behavior. |
| [MDN: SVG Tutorial](https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorials/SVG_from_scratch) | Vector geometry, coordinate systems, fills, strokes, gradients, clipping, masking, filters, and DOM integration | Build a structured icon with a gradient, mask, and pointer interaction. |
| [MDN: Canvas Tutorial](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial) | Mutable drawing state, paths, transforms, compositing, clipping, animation, images, and pixel manipulation | Record the command stream for the opacity, clipping, and blend fixtures in this document. |
| [MDN: WebGL Tutorial](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial) | Buffers, shaders, textures, animation, lighting, and the programmable graphics pipeline | Render one fixture with an explicit texture, blend state, and shader uniform, then document where its semantic names live. |

#### Direct Comparisons

| Resource | Comparison | How to interpret it |
| --- | --- | --- |
| [W3C: Accessible Web Graphics with SVG and Canvas](https://www.w3.org/Talks/2014/schepers-accessible_graphics/schepers-accessible_graphics-summary.html) | Compares SVG's retained document and event model with Canvas's script-driven pixel surface, including accessibility consequences | The retained versus immediate distinction remains useful. Treat API details and browser-support claims as historical material from 2014. |
| [Figma: Building a Professional Design Tool on the Web](https://www.figma.com/blog/building-a-professional-design-tool-on-the-web/) | Explains a real product choice among HTML, SVG, Canvas 2D, and WebGL, then describes Figma's own scene, tiling, masking, blending, text, and compositing layers | Use it as a case study in requirements and architecture. Its browser-performance observations describe Figma's 2015 environment rather than a current benchmark. |

The Figma article is especially relevant to interoperability. A product can
expose a retained, semantic authoring model while implementing that model with
a lower-level renderer. The document schema and rendering backend therefore
belong to separate comparison layers.

#### Renderer Architecture and Engineering Research

| Resource | Research value |
| --- | --- |
| [Chrome: Inside Look at a Modern Web Browser, Part 3](https://developer.chrome.com/blog/inside-browser-part3) | Traces DOM, style, layout, paint records, layer trees, raster tiles, and compositor frames with an approachable engine-level vocabulary. |
| [Chromium RenderingNG Architecture](https://developer.chrome.com/docs/chromium/renderingng-architecture) | Provides a detailed production pipeline and the artifacts passed between style, layout, paint, layer creation, raster, aggregation, and draw. |
| [Mozilla: How WebRender Gets Rid of Jank](https://hacks.mozilla.org/2017/10/the-whole-web-at-maximum-fps-how-webrender-gets-rid-of-jank/) and [Firefox Rendering Overview](https://firefox-source-docs.mozilla.org/gfx/RenderingOverview.html) | Show another engine strategy: preserve a display list and scene, then translate it into GPU work. This helps separate Web semantics from Chromium-specific architecture. |
| [Figma Rendering: Powered by WebGPU](https://www.figma.com/blog/figma-rendering-powered-by-webgpu/) | Describes a modern migration from WebGL to WebGPU behind a renderer abstraction, including shaders, resource binding, fallback, and compatibility testing. |

A useful reading path is:

1. Use the MDN overview and tutorials to learn the observable API models.
2. Read the W3C comparison for retained structure, hit testing, and
   accessibility.
3. Read Figma's original renderer case study to see product requirements drive
   an architectural choice.
4. Compare Chromium and Firefox pipelines to distinguish standardized results
   from engine-specific execution.
5. Read Figma's WebGPU migration to study how one application-level scene
   model can survive a rendering-backend change.

### 3.2 Established Taxonomies

The Web ecosystem uses several overlapping taxonomies. Each one answers a
different research question.

| Taxonomy | Organizing model | Best use in this research | Boundary |
| --- | --- | --- | --- |
| [MDN CSS Reference](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference) | Language syntax, selectors, at-rules, values, properties, and CSS modules | Discover the API surface and move from a property to its module, guides, specifications, and compatibility data | Reference organization does not express rendering order. |
| [CSSWG modules and CSS Snapshot](https://www.w3.org/TR/css-2024/) | Independently versioned specifications such as Display, Color, Images, Transforms, Masking, Filter Effects, and Compositing | Establish normative ownership, terminology, value grammar, and relationships between specifications | Module boundaries follow standards work and can divide one visual phenomenon across several documents. |
| [CSS visual formatting model](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Display/Visual_formatting_model) | Document tree to generated boxes, formatting contexts, containing blocks, positioning schemes, and dimensions | Build the foundational model for layout and box generation | Modern layout modules extend the CSS2 foundation. |
| [CSS 2.2 painting order](https://www.w3.org/TR/CSS22/zindex.html) | Stacking contexts and the ordered painting of backgrounds, borders, in-flow content, positioned descendants, and outlines | Explain why tree order, `z-index`, generated boxes, and stacking contexts affect visible results | Modern effects add grouping and compositing rules in later modules. |
| [Critical Rendering Path](https://web.dev/learn/performance/understanding-the-critical-path/) | DOM and CSSOM, render tree, style, layout, paint, composite, and draw | Use as the first, widely recognized map from resources to pixels and as a performance-debugging vocabulary | The stages are intentionally coarse and focus on page rendering. |
| [Chromium RenderingNG](https://developer.chrome.com/docs/chromium/renderingng-architecture) | Animate, style, layout, pre-paint, scroll, paint, commit, layerize, raster, activate, aggregate, and draw | Study concrete engine artifacts, invalidation, main/compositor thread boundaries, and stages that can be skipped | This is Chromium architecture; other engines can preserve Web semantics through different internals. |
| [CSS compositing, masking, and filter models](https://www.w3.org/TR/compositing-1/) | Source, backdrop, groups, filters, clipping, masking, blending, compositing, and opacity | Analyze the effects that motivated this document and compare them with Figma and graphics APIs | These specifications assume geometry and painted content supplied by other parts of CSS. |
| Tailwind documentation taxonomy | Author-facing utility families such as Layout, Typography, Effects, and Filters | Observe how a design-system tool curates the Web surface into a styling API | The taxonomy reflects Tailwind's product and version choices. |

These views can be arranged as a stack:

```text
authoring vocabulary
  Tailwind utilities, CSS declarations, DOM and SVG attributes

language and standards ownership
  MDN reference, CSS modules, HTML, SVG, Canvas, WebGL

semantic formatting and rendering
  cascade, box generation, layout, paint order, effects, compositing

engine execution
  style, layout, pre-paint, paint, layerize, raster, composite, draw

observed output
  pixels under a declared viewport, scale, color space, and backdrop
```

For design-system interoperability, the semantic formatting and rendering
layer is the central comparison level. Authoring syntax supplies provenance,
engine execution helps explain performance and implementation constraints, and
pixels provide concrete validation.

#### How to Use MDN Without Drowning in Reference Pages

MDN offers three useful entry shapes:

1. **Module pages** group related concepts, properties, and guides. Start with
   Display, Images, Color, Masking, Filter Effects, and Compositing and
   Blending.
2. **Concept guides** explain cross-property models such as the visual
   formatting model, containing blocks, formatting contexts, stacking
   contexts, and value processing.
3. **Property pages** answer exact syntax, initial value, inheritance,
   animation type, formal grammar, examples, specifications, and browser
   compatibility.

Move through them in that order for a new concept:

```text
module overview
  -> concept guide
  -> relevant property and data-type pages
  -> linked normative specification
  -> minimal executable fixture
```

Property-first lookup remains efficient when implementing a known declaration.
Module-first reading builds the relationships needed for interop.

### 3.3 Recommended Reading Order

Start with the concepts that appear across every renderer:

1. **Color and alpha**: color spaces, encoded values, interpolation, alpha,
   premultiplied-alpha handling, and output conversion.
2. **Geometry and coordinate spaces**: boxes, paths, transforms, local space,
   object bounding-box space, viewport space, and device pixels.
3. **Clipping and masking**: hard coverage, alpha masks, luminance masks,
   multiple mask layers, and mask coordinate systems.
4. **Blending and compositing**: source, backdrop, group isolation, blend
   functions, Porter-Duff operators, and operation order.
5. **Filters and effects**: layer blur, backdrop blur, shadows, filter regions,
   and intermediate surfaces.
6. **Renderer-specific state**: CSS cascade and stacking contexts, Canvas
   drawing state, WebGL state and shaders, and Figma node hierarchy.

This order makes a later mapping table explain behavior rather than compare
property names in isolation.

### 3.4 A Case-Driven Learning Loop

Starting from a desired visual implementation is a productive learning method.
Turn each copied or adapted example into a controlled rendering experiment.

For each visual phenomenon:

1. **Reproduce** the smallest working example and retain its original source.
2. **Classify** every declaration by MDN/CSS module and by rendering stage.
3. **Draw the scene** as geometry, paints, effects, clips or masks, groups, and
   compositing relationships.
4. **Perturb one condition at a time**: backdrop, overlapping children, group
   opacity, isolation, transforms, scrolling, color space, or device scale.
5. **Inspect the browser**: specified and computed values, box geometry,
   stacking contexts, paint activity, composited layers, and screenshots.
6. **Read the specification** where the perturbation exposes an unexpected
   result.
7. **Recreate the scene in Figma** and export variables, paints, effects,
   masks, hierarchy, and sibling order.
8. **Express it in Lynx** and record represented, resolved, expressible,
   verified, lossy, and unsupported stages.

The perturbations turn an implementation example into semantic evidence. A
single screenshot shows one output; a small family of related scenes reveals
which relationships the implementation depends on.

#### Recommended First Cases

| Desired result | Start with | Perturbations that reveal the model | Main taxonomies crossed |
| --- | --- | --- | --- |
| Translucent card | Alpha background and element opacity | Add overlapping children, shadow, and a textured backdrop | Color and alpha, group opacity, paint, compositing |
| Rounded media crop | `overflow: hidden`, `clip-path`, and `mask-image` variants | Transform the child, blur it, soften the edge, and animate the boundary | Visual formatting, clipping, masking, effect order |
| Frosted glass | Translucent fill plus `backdrop-filter` | Change backdrop content, isolation, clipping, scroll position, and nested opacity | Backdrop selection, filter region, stacking, compositing |
| Gradient text | Background gradient plus text clipping | Add text shadow, multiple lines, variable font metrics, and selection | Typography, background paint, clipping, generated glyph geometry |
| Blended illustration | `mix-blend-mode` | Reorder siblings, add an isolated group, change the parent background, and apply opacity | Paint order, backdrop, group isolation, blending |
| Faded or combined mask | Gradient or image mask | Switch alpha/luminance mode, repeat, resize, and combine two mask layers | Mask source, coordinate space, layer order, mask composite |

The first three cases already cover the distinction between paint alpha, group
opacity, clipping, masking, foreground filters, backdrop filters, and
compositing. They provide a compact bridge from familiar implementation-driven
learning to the structured capability map required by the RFC.

## 4. Tailwind CSS as Design-System CSS Organization

Tailwind is a practical first study because it turns a design vocabulary and a
property ontology into a public utility API. A utility can be modeled as:

```text
utility = property family
        + value grammar or design token
        + state and context variants
        + cascade-layer placement
        + generated CSS declarations
```

The organization of utilities answers several design-system questions:

- Which CSS capabilities receive curated design values?
- Which capabilities are exposed as fixed keywords, open grammars, arbitrary
  values, or plugin extensions?
- Which token namespaces fan out into several CSS properties?
- Which states and environmental conditions participate in the styling API?
- Which parts of the design language remain available in compiled output?

### 4.1 Tailwind v3 and v4

| Dimension | Tailwind v3 | Tailwind v4 | Interop question |
| --- | --- | --- | --- |
| Design vocabulary | Nested values in `tailwind.config.js` under `theme` and `theme.extend` | Top-level CSS theme variables declared with `@theme` | Can the extractor preserve original token identity and extension/reset behavior? |
| Connection to utilities | Core plugins and JavaScript plugins consume theme paths | Theme-variable namespaces create related utility and variant APIs; static utilities remain framework-defined | Which token namespaces generate which utility families? |
| Runtime representation | Theme configuration is a build input; projects may deliberately emit CSS custom properties | Theme variables are emitted as native CSS custom properties and used by generated utilities | Which aliases remain observable at runtime? |
| Entry and layers | `@tailwind base`, `components`, and `utilities`, with Tailwind-managed `@layer` buckets | `@import "tailwindcss"` and native cascade layers for theme, base, components, and utilities | Does source order or layer order change the semantic result? |
| Extension API | JavaScript plugins such as `addUtilities`, `matchUtilities`, and `addVariant` | CSS-first `@utility` and `@custom-variant`; compatibility directives can load legacy config and plugins | Can an inventory distinguish built-in, project-defined, and plugin-defined capabilities? |
| Source detection | Explicit `content` configuration | Automatic detection with `source()` and `@source` controls | Can the build reproduce the complete intended API rather than only currently used classes? |
| Open values | Configured scales plus arbitrary values and plugin-defined matching | Theme namespaces, derived values, arbitrary values, and functional utilities | Does a utility accept a closed token set, a typed grammar, or both? |
| Distribution artifact | Generated CSS usually contains only detected utilities | Generated CSS usually contains only detected utilities; `@theme static` can force theme-variable emission | Which authoring data disappears after compilation? |

### 4.2 Official Documentation Taxonomy

The official documentation sidebar is a curated, versioned view of Tailwind's
CSS capability model. Record it as source data before inspecting individual
utilities or compiler output.

This comparison uses the versions displayed by the official sites on
2026-08-29: archived Tailwind v3.4.17 and current Tailwind v4.3.

#### Top-Level Sidebar Organization

The complete section order is:

| Order | Tailwind v3.4.17 | Tailwind v4.3 |
| --- | --- | --- |
| 1 | Getting Started | Getting started |
| 2 | Core Concepts | Core concepts |
| 3 | Customization | Base styles |
| 4 | Base Styles | Layout |
| 5 | Layout | Flexbox & Grid |
| 6 | Flexbox & Grid | Spacing |
| 7 | Spacing | Sizing |
| 8 | Sizing | Typography |
| 9 | Typography | Backgrounds |
| 10 | Backgrounds | Borders |
| 11 | Borders | Effects |
| 12 | Effects | Filters |
| 13 | Filters | Tables |
| 14 | Tables | Transitions & Animation |
| 15 | Transitions & Animation | Transforms |
| 16 | Transforms | Interactivity |
| 17 | Interactivity | SVG |
| 18 | SVG | Accessibility |
| 19 | Accessibility | — |
| 20 | Official Plugins | — |

The shifted row numbers are less significant than these structural changes:

| Area | Tailwind v3.4.17 organization | Tailwind v4.3 organization | Design-system reading |
| --- | --- | --- | --- |
| Theme authoring | Configuration, Content, Theme, Screens, Colors, Spacing, Plugins, and Presets live under **Customization** | Theme variables, Colors, Detecting classes in source files, and Functions and directives live under **Core concepts** | v4 presents design vocabulary and utility generation as part of the CSS authoring model. |
| Sizing | Physical width and height families plus `size` | Adds logical inline-size and block-size families | The utility ontology now exposes writing-mode-aware sizing as a first-class area. |
| Typography | Familiar font and text families | Adds font stretch, font feature settings, tab size, and overflow wrap; several pages use CSS property names directly | The sidebar moves closer to a CSS property inventory while retaining utility-oriented grouping. |
| Backgrounds and borders | Separate pages for gradient stops, divide utilities, ring utilities, and shadow color | Related utility families are consolidated into broader property pages | A missing sidebar leaf can indicate page consolidation, so compiler evidence is required before classifying a capability as removed. |
| Effects | Five entries | Fourteen entries, including text shadow and nine mask properties | v4 expands from visual finish controls into a larger compositing and coverage surface. |
| Filters | Eighteen flat operation pages | Two parent properties with nested operation pages | v4 documents the filter target and the operation family as separate levels. |
| Transforms | Five two-dimensional transform families | Adds transform, backface visibility, perspective, transform style, and zoom | Three-dimensional presentation and grouping semantics receive explicit coverage. |
| Interactivity | Core form, pointer, scroll, and touch controls | Adds color scheme, field sizing, and scrollbar properties | Browser and platform presentation controls become more visible in the design API. |
| Extensions | Plugins and Presets under Customization, plus an Official Plugins section | Legacy plugins remain available through compatibility directives; the main sidebar has no corresponding top-level sections | The documentation hierarchy now centers CSS-first extension mechanisms. |

The sidebar describes Tailwind's public teaching and authoring model. It is not
a complete Web-platform inventory, and its categories do not reproduce the
browser rendering pipeline.

#### Effects: Exact Sidebar Comparison

[Tailwind v3.4.17 Effects](https://v3.tailwindcss.com/docs/box-shadow) contains
five entries:

1. Box Shadow
2. Box Shadow Color
3. Opacity
4. Mix Blend Mode
5. Background Blend Mode

[Tailwind v4.3 Effects](https://tailwindcss.com/docs/box-shadow) contains
fourteen entries:

1. `box-shadow`
2. `text-shadow`
3. `opacity`
4. `mix-blend-mode`
5. `background-blend-mode`
6. `mask-clip`
7. `mask-composite`
8. `mask-image`
9. `mask-mode`
10. `mask-origin`
11. `mask-position`
12. `mask-repeat`
13. `mask-size`
14. `mask-type`

| Capability family | v3.4.17 | v4.3 | Structural reading |
| --- | --- | --- | --- |
| Box shadow | Shape and color are separate sidebar pages | One `box-shadow` page includes shape, color, custom-property, and arbitrary-value forms | v4 consolidates one CSS property family even though its utility values still come from shadow and color vocabularies. |
| Text shadow | No first-class sidebar entry | `text-shadow` is first-class | Typography gains an effect whose geometry and color both need token and renderer mappings. |
| Opacity | First-class | First-class | Tailwind places group-level opacity beside shadows and blending. |
| Blend modes | Mix and background blend modes are first-class | Both remain first-class | Element/backdrop blending and multiple-background blending need different operation targets. |
| Masking | No first-class sidebar entries | Nine property pages cover source, coordinate area, positioning, repetition, sizing, interpretation, and layer composition | Masking is represented as a multi-property subsystem rather than one Boolean capability. |

The v4 mask pages expose several independent axes:

| Page | Semantic axis to capture |
| --- | --- |
| [`mask-image`](https://tailwindcss.com/docs/mask-image) | One or more mask sources, including images and generated gradients |
| [`mask-mode`](https://tailwindcss.com/docs/mask-mode) | Alpha, luminance, or source-defined interpretation |
| [`mask-clip`](https://tailwindcss.com/docs/mask-clip) | Painting area that bounds each mask layer |
| [`mask-origin`](https://tailwindcss.com/docs/mask-origin) | Coordinate origin for mask positioning |
| [`mask-position`](https://tailwindcss.com/docs/mask-position) | Position of each mask layer |
| [`mask-size`](https://tailwindcss.com/docs/mask-size) | Concrete or intrinsic sizing of each mask layer |
| [`mask-repeat`](https://tailwindcss.com/docs/mask-repeat) | Tiling behavior of each mask layer |
| [`mask-composite`](https://tailwindcss.com/docs/mask-composite) | Add, subtract, intersect, or exclude operations between mask layers |
| [`mask-type`](https://tailwindcss.com/docs/mask-type) | Alpha or luminance interpretation for SVG `<mask>` elements |

This organization reveals a mask-layer model: source, interpretation,
coordinate system, geometry, repetition, and composition. A normalized
operation should retain those axes per layer and preserve layer order.

`clip-path` is absent from both official sidebars. Overflow clipping appears
under Layout, while isolation appears under Layout and blend modes appear under
Effects. The interop research should regroup these distributed utilities by
rendering semantics when it evaluates clipping, masking, grouping, and
compositing.

#### Filters: Flat Operations to Property Hierarchy

Tailwind v3.4.17 presents Filters as eighteen flat pages:

```text
Filters
  Blur
  Brightness
  Contrast
  Drop Shadow
  Grayscale
  Hue Rotate
  Invert
  Saturate
  Sepia
  Backdrop Blur
  Backdrop Brightness
  Backdrop Contrast
  Backdrop Grayscale
  Backdrop Hue Rotate
  Backdrop Invert
  Backdrop Opacity
  Backdrop Saturate
  Backdrop Sepia
```

Tailwind v4.3 presents two parent properties and their operations:

```text
Filters
  filter
    blur
    brightness
    contrast
    drop-shadow
    grayscale
    hue-rotate
    invert
    saturate
    sepia
  backdrop-filter
    blur
    brightness
    contrast
    grayscale
    hue-rotate
    invert
    opacity
    saturate
    sepia
```

The operation set is largely stable. The hierarchy now makes the processing
target explicit:

- `filter` operates on the element's rendered input;
- `backdrop-filter` samples content behind the element;
- each parent accepts a complete custom-property or arbitrary filter list;
- the child utilities can be combined into one filter result.

This suggests a stronger normalized shape than independent blur or contrast
fields:

```ts
type FilterChain = {
  target: "element" | "backdrop"
  operations: readonly FilterOperation[]
  sourceUtilities: readonly string[]
}
```

Operation order belongs in the contract because CSS filter functions are
applied as an ordered list. The order of class names in HTML does not establish
that operation order. Compiler fixtures must establish how each Tailwind
version composes multiple utilities and resets the parent property.

#### What the Sidebar Can and Cannot Establish

Treat the official sidebar as one evidence layer:

- it identifies Tailwind's public capability families and teaching hierarchy;
- it exposes additions, consolidation, and changes in conceptual grouping;
- it helps define a reproducible documentation inventory for each version;
- it does not prove generated declarations, combination order, default values,
  theme namespaces, browser support, or Lynx support.

Those remaining questions require the framework source, pinned compiler
fixtures, Web specifications, and target-runtime experiments.

### 4.3 The Same Color Vocabulary in Both Models

Tailwind v3 configuration:

```js
export default {
  content: ["./src/**/*.{html,js,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          500: "oklch(0.64 0.18 255)",
        },
      },
    },
  },
}
```

Tailwind v4 CSS:

```css
@import "tailwindcss";

@theme {
  --color-brand-500: oklch(0.64 0.18 255);
}
```

Both can expose `bg-brand-500`, `text-brand-500`, `border-brand-500`, and
other color-driven utilities. Their sources have different identities:
`theme.colors.brand.500` is a configuration path, while
`--color-brand-500` is a CSS theme variable in the `--color-*` namespace.

A mapping record should retain the source identity, compiler version, utility
families, and generated declarations. Treating both inputs as the resolved
color value would discard how the design vocabulary becomes an API.

### 4.4 Utility Inventory Schema

Build machine-readable inventories for a pinned v3 release and a pinned v4
release. One record should contain at least:

```ts
type UtilityInventoryRecord = {
  id: string
  frameworkVersion: string
  documentationGroup: string
  documentationParent?: string
  documentationOrder: number
  documentationUrl: string
  family: string
  cssConceptKind: "property" | "function" | "keyword" | "composite"
  classGrammar: string
  cssProperties: readonly string[]
  valueSource: "static" | "theme" | "arbitrary" | "plugin" | "mixed"
  themeNamespaces: readonly string[]
  valueGrammar?: string
  variants: readonly string[]
  cascadeLayer: string
  sourceKind: "core" | "project" | "plugin"
  provenance: readonly string[]
}
```

The first inventory should cover these families in sequence:

1. spacing, sizing, and layout;
2. typography;
3. color and alpha;
4. backgrounds, borders, fills, and strokes;
5. shadows, filters, and backdrop filters;
6. clipping and masking;
7. blending, isolation, and opacity;
8. transforms, perspective, and three-dimensional presentation.

Generate the inventory from framework source and compiler experiments. The
documentation supplies the public explanation; compiled fixtures reveal
defaults, aliases, declaration ordering, and version-specific gaps.

The documentation fields preserve the official organization separately from
the CSS concept and compiled utility. This allows the research to detect page
consolidation without interpreting it as capability removal.

### 4.5 First Tailwind Experiment

Compile the same small design vocabulary with pinned Tailwind v3 and v4
toolchains. Force every test utility into the output and record:

- the official sidebar path and ordering;
- input configuration or CSS;
- detected class candidates;
- generated selectors and declarations;
- cascade layer and source order;
- emitted custom properties;
- unresolved and lowered color expressions;
- framework and plugin versions.

Use fixtures for solid color with alpha, node opacity, gradients, masks, clip
paths, blend modes, filters, arbitrary values, hover/focus states, dark mode,
and a scoped named theme. This creates an evidence base for the adapter split
already described in [detailed-design.md](./detailed-design.md).

## 5. Figma as an Authoring and Representation System

Figma should be studied in layers. The Plugin API provides a typed view of the
document and is a stronger research source than generated CSS snippets.

### 5.1 Variable Layer

Capture:

- variable collections and modes;
- variable type, scopes, and code syntax;
- `valuesByMode` with unresolved aliases;
- explicit and resolved modes on consumer nodes;
- bindings from variables to node, paint, text, and effect fields;
- library identity and provenance where available.

A mode is contextual data. Resolving every variable to one value during export
would lose light/dark, density, platform, or brand relationships.

### 5.2 Paint and Effect Layer

Figma represents a node fill as an ordered array of paints. Paints can include
solid colors, gradients, images, videos, patterns, and shaders. Common paint
properties include visibility, opacity, blend mode, and variable bindings.

This creates several mapping cases:

| Figma structure | Web candidate | Required preservation |
| --- | --- | --- |
| Solid paint color plus paint opacity | CSS color with alpha or a dedicated paint layer | Color binding, paint opacity, and layer order |
| Several fills | Multiple CSS backgrounds, SVG resources, or several draw operations | Every paint, its order, visibility, blend mode, and transform |
| Gradient paint | CSS gradient, SVG gradient, or renderer shader | Stops, RGBA values, interpolation assumptions, transform, and coordinate space |
| Image paint | CSS background image, `<img>`, SVG image, Canvas draw call, or texture | Source identity, scaling mode, transform, filters, and crop |
| Drop or inner shadow | `box-shadow`, `filter`, SVG filter, or explicit draw pass | Geometry, spread, blur, color, blend mode, and whether translucent interior pixels reveal the shadow |
| Layer or background blur | CSS `filter`, `backdrop-filter`, SVG filter, or offscreen pass | Input region, radius, clipping, group boundary, and backdrop dependency |

Each Web candidate requires a capability check. Similar names do not establish
equivalent rendering.

### 5.3 Scene, Clip, and Mask Layer

Capture these Figma relationships as structure:

- node hierarchy and sibling order;
- geometry, transforms, constraints, and layout;
- `clipsContent` on frame-like nodes;
- `isMask`, `maskType`, and the subsequent siblings affected by a mask;
- node opacity and blend mode;
- group boundaries and `PASS_THROUGH` behavior;
- effects, paint arrays, and visibility.

Figma mask semantics make sibling order part of the operation. A flat
`mask: true` field on each affected node cannot reproduce the mask range. The
export should record the mask node, the containing group, and the ordered set
of masked siblings.

### 5.4 Figma-to-Web Comparison Table

| Figma concept | Closest Web research area | Main risk |
| --- | --- | --- |
| Variable alias and collection mode | CSS custom-property graph plus selector/media context | Resolution can erase aliases and inactive modes. |
| Paint opacity | Color alpha or opacity on a dedicated paint layer | CSS element opacity applies at a different grouping level. |
| Node opacity | CSS/SVG group opacity or offscreen compositing | Distributing opacity into children changes overlap. |
| Ordered fills | CSS background layers, SVG resources, or draw passes | A target may lack per-paint blend and opacity controls. |
| `clipsContent` | Overflow clipping | Rounded corners, transforms, effects, and implementation-specific bounds need fixtures. |
| Vector mask | Clip path or alpha mask | Figma mask geometry and sibling propagation must be preserved. |
| Alpha/luminance mask | CSS/SVG masks or explicit compositing pass | Color-space and luminance rules can affect coverage. |
| Layer blend mode | `mix-blend-mode` or renderer blend state | Backdrop selection and isolation boundaries can differ. |
| `PASS_THROUGH` group | Non-isolated group behavior | Mapping it to one element property can introduce a group boundary. |
| Background blur | `backdrop-filter` or offscreen backdrop pass | The sampled backdrop region and clipping order determine the result. |

## 6. Comparative Fixture Laboratory

The research should produce executable evidence instead of a prose-only API
catalog. Create a small set of scenes and express each scene in the systems
that support it.

### 6.1 Initial Fixtures

| Fixture | Question | Required variants |
| --- | --- | --- |
| Paint alpha | Where is alpha stored and interpolated? | solid paint, gradient stop, image alpha |
| Group opacity | When is an intermediate group created? | one child, overlapping children, child blend mode |
| Hard clip | Which coordinate space defines the boundary? | rectangle, rounded rectangle, transformed path |
| Mask | How is partial coverage calculated? | vector, alpha, luminance, nested mask |
| Blend | Which content becomes the backdrop? | isolated group, pass-through group, reordered siblings |
| Effect ordering | When do effects observe or escape the clip? | layer blur, background blur, drop shadow |
| Multiple paints | How are layer order and per-paint controls represented? | two solids, gradient plus image, hidden paint |
| Contextual token | How is one semantic role resolved by context? | light/dark, scoped theme, node variable mode |

### 6.2 Evidence to Save

For every fixture, save:

- the editable source;
- the source object graph or declaration AST;
- unresolved token and variable bindings;
- the resolved operation graph proposed by the adapter;
- compiler or renderer versions;
- generated CSS or recorded draw commands;
- output size, device scale, color space, and backdrop;
- reference images for visual comparison;
- observed differences and the accepted tolerance.

Screenshots validate a concrete rendering. They supplement structural evidence
and help locate mismatches.

### 6.3 Capability Status

Classify every target operation with explicit evidence:

| Status | Meaning |
| --- | --- |
| Represented | The source adapter captures the relevant structure and provenance. |
| Resolved | The normalized operation can be determined for a concrete context. |
| Expressible | The target exposes a plausible construction for the operation. |
| Verified | A fixture demonstrates behavior within the declared tolerance. |
| Lossy | The target construction preserves an accepted subset of the source semantics. |
| Unsupported | No accepted target construction exists for the current capability profile. |

This separates parser coverage from renderer capability and visual fidelity.

## 7. Observation Record Before a Canonical Schema

Use a broad observation record during research. Narrow it only after several
systems express the same concept.

```ts
type RenderingObservation = {
  sourceSystem: string
  sourceVersion: string
  sourceLocator: string
  operation: string
  inputs: readonly unknown[]
  coordinateSpace?: string
  colorSpace?: string
  alphaPlacement?: string
  groupBoundary?: string
  clipOrMask?: unknown
  blendMode?: string
  compositeOperator?: string
  context: readonly string[]
  sourceBindings: readonly string[]
  outputConditions: Record<string, string>
  evidence: readonly string[]
  notes: readonly string[]
}
```

The field values should come from source adapters and fixture observations.
The eventual canonical representation can replace source terminology with
stable semantics after equivalence has been demonstrated.

## 8. Research Sequence

### Phase 1: Vocabulary and Tailwind Inventories

- Define the terms in Section 2 with primary specifications.
- Pin one Tailwind v3 and one Tailwind v4 release.
- Generate utility inventories and a compiler-diff report.
- Identify which utility families are token-driven, static, open-valued, or
  plugin-defined.

### Phase 2: Web Rendering Fixtures

- Implement the initial scenes in HTML/CSS and SVG.
- Add Canvas 2D recordings for scenes that expose compositing differences.
- Add WebGL only where shader, stencil, framebuffer, or blend-state behavior
  contributes a distinct capability.
- Record structural and pixel evidence.

### Phase 3: Figma Fixtures and Export

- Recreate the same scenes in a dedicated Figma research file.
- Export nodes through a small authorized plugin using current Plugin API
  typings.
- Preserve variable aliases, modes, paint arrays, effects, masks, and sibling
  order.
- Compare structural differences before comparing screenshots.

### Phase 4: Lynx Capability Map

- Express each normalized fixture with available Lynx primitives.
- Mark represented, resolved, expressible, verified, lossy, and unsupported
  stages separately.
- Record fallbacks as explicit policies with scope and rationale.
- Feed stable findings into the RFC's experience-capability map and semantic
  contract.

### Phase 5: Canonical Representation Candidates

- Promote concepts demonstrated in multiple source systems.
- Keep token relationships and rendering operations as linked modules.
- Define component anatomy and state as the layer that binds tokens to
  operations.
- Validate every canonical operation against at least two source systems and
  the Lynx target profile.

## 9. First Deliverable

The first useful deliverable is a Tailwind utility-organization report plus
four cross-renderer fixtures:

1. paint alpha versus node opacity;
2. hard clipping versus alpha masking;
3. blend mode with isolated and pass-through groups;
4. light/dark semantic color resolution.

This scope is large enough to expose the important structural differences and
small enough to keep compiler and pixel evidence reviewable. It will clarify
which parts belong in a token schema, a rendering schema, an adapter capability
profile, and a component recipe.

## 10. Primary References

### Tailwind CSS

- [Tailwind CSS v3: Theme Configuration](https://v3.tailwindcss.com/docs/theme)
- [Tailwind CSS v3: Functions and Directives](https://v3.tailwindcss.com/docs/functions-and-directives)
- [Tailwind CSS v3: Plugins](https://v3.tailwindcss.com/docs/plugins)
- [Tailwind CSS v4: Theme Variables](https://tailwindcss.com/docs/theme)
- [Tailwind CSS v4: Functions and Directives](https://tailwindcss.com/docs/functions-and-directives)
- [Tailwind CSS v4: Adding Custom Styles](https://tailwindcss.com/docs/adding-custom-styles)
- [Tailwind CSS v4: Detecting Classes in Source Files](https://tailwindcss.com/docs/detecting-classes-in-source-files)
- [Tailwind CSS v4: Upgrade Guide](https://tailwindcss.com/docs/upgrade-guide)

### Web Rendering

- [MDN: Drawing Graphics](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Client-side_APIs/Drawing_graphics)
- [MDN: SVG Tutorial](https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorials/SVG_from_scratch)
- [MDN: Canvas Tutorial](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial)
- [MDN: WebGL Tutorial](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial)
- [MDN CSS Reference](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference)
- [CSS Snapshot 2024](https://www.w3.org/TR/css-2024/)
- [MDN: Visual Formatting Model](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Display/Visual_formatting_model)
- [CSS 2.2: Painting Order](https://www.w3.org/TR/CSS22/zindex.html)
- [web.dev: Critical Rendering Path](https://web.dev/learn/performance/understanding-the-critical-path/)
- [Chrome: Inside Look at a Modern Web Browser, Part 3](https://developer.chrome.com/blog/inside-browser-part3)
- [Chromium RenderingNG Architecture](https://developer.chrome.com/docs/chromium/renderingng-architecture)
- [Mozilla: How WebRender Gets Rid of Jank](https://hacks.mozilla.org/2017/10/the-whole-web-at-maximum-fps-how-webrender-gets-rid-of-jank/)
- [Firefox Rendering Overview](https://firefox-source-docs.mozilla.org/gfx/RenderingOverview.html)
- [W3C: Accessible Web Graphics with SVG and Canvas](https://www.w3.org/Talks/2014/schepers-accessible_graphics/schepers-accessible_graphics-summary.html)
- [CSS Color Module Level 4](https://www.w3.org/TR/css-color-4/)
- [Compositing and Blending Level 1](https://www.w3.org/TR/compositing-1/)
- [CSS Masking Module Level 1](https://www.w3.org/TR/css-masking-1/)
- [Filter Effects Module Level 1](https://www.w3.org/TR/filter-effects-1/)
- [CSS Overflow Module Level 3](https://www.w3.org/TR/css-overflow-3/)
- [CSS Cascading and Inheritance Level 5](https://www.w3.org/TR/css-cascade-5/)
- [Scalable Vector Graphics 2](https://www.w3.org/TR/SVG2/)
- [HTML Standard: Canvas](https://html.spec.whatwg.org/multipage/canvas.html)
- [WebGL Specification](https://registry.khronos.org/webgl/specs/latest/1.0/)

### Figma

- [Figma: Building a Professional Design Tool on the Web](https://www.figma.com/blog/building-a-professional-design-tool-on-the-web/)
- [Figma Rendering: Powered by WebGPU](https://www.figma.com/blog/figma-rendering-powered-by-webgpu/)
- [Figma Plugin API Introduction](https://developers.figma.com/docs/plugins/)
- [Figma Plugin API: Paint](https://developers.figma.com/docs/plugins/api/Paint/)
- [Figma Plugin API: FrameNode](https://developers.figma.com/docs/plugins/api/FrameNode/)
- [Figma Plugin API: BlendMode](https://developers.figma.com/docs/plugins/api/BlendMode/)
- [Figma Plugin API: MaskType](https://developers.figma.com/docs/plugins/api/MaskType/)
- [Figma Plugin API: Effect](https://developers.figma.com/docs/plugins/api/Effect/)
- [Figma Plugin API: Variable](https://developers.figma.com/docs/plugins/api/Variable/)
- [Figma Plugin API: VariableCollection](https://developers.figma.com/docs/plugins/api/VariableCollection/)
- [Figma Plugin API: VariableScope](https://developers.figma.com/docs/plugins/api/VariableScope/)
