# LUNA Design-System Interop: Contract Model

## Core Principle

A design-system interop contract defines correspondence between **design semantics**, not correspondence between concrete values.

Values are realizations of those semantics under a particular context and resolution model. A contract should therefore remain valid even when the underlying values, source syntax, theme representation, or resolution timing changes.

```text
Source Semantic
      │
      │  Semantic Contract
      ▼
LUNA Semantic
```

The simplest contract is a direct semantic mapping:

```text
shadcn.background  →  LUNA.canvas
```

Formally:

$$
M: S_{source} \rightarrow S_{LUNA}
$$

where `M` maps a semantic role in the source design system to its corresponding role in LUNA.

## Resolution Is Separate from Mapping

Each design system may realize the same semantic role differently:

$$
R(s, c) \rightarrow v
$$

where:

* `s` is a semantic role
* `c` is its resolution context
* `v` is the resulting design value or expression

A semantic contract asserts that two roles remain compatible across their realizations:

$$
R_{source}(s, c) \approx R_{LUNA}(M(s), c)
$$

For a static token system, the resolution function may collapse to a constant:

```text
semantic role → value
```

For a runtime-resolved system, the realization may depend on theme, state, platform, environment, contrast, component scope, or other contextual dimensions:

```text
semantic role × context → value
```

The contract itself can remain static while the realization remains unresolved.

## Runtime-Resolved Contracts

Runtime resolution makes the contract richer because interoperability must preserve not only semantic identity, but also how that semantic varies across context.

A runtime-resolved contract may therefore include:

```text
Semantic Mapping
+
Context Mapping
+
Resolution Semantics
```

Formally:

$$
M: S_{source} \rightarrow S_{LUNA}
$$

$$
H: C_{source} \rightarrow C_{LUNA}
$$

with compatibility evaluated as:

$$
R_{source}(s, c)
\approx
R_{LUNA}(M(s), H(c))
$$

This shifts interoperability from comparing resolved points to comparing resolution functions.

> **Static contracts compare realizations. Runtime-resolved contracts compare how semantics are realized.**

## Design Implication

The interop layer should:

1. **Map semantic roles explicitly.**
2. **Preserve unresolved source expressions and contextual dependencies.**
3. **Avoid collapsing a source design system into resolved values during normalization.**
4. **Treat runtime resolution as part of the source semantic model when it affects how a role behaves across contexts.**

A concise guiding principle is:

> **Map semantics; preserve resolution.**

This allows LUNA to interoperate with simple static token systems today while keeping the same contract model applicable to contextual and runtime-resolved design systems later.
