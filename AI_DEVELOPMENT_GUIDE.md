# lynx-ui AI Development Guide

> Goal: make lynx-ui explicitly AI-friendly by turning existing component patterns into executable implementation rules, concrete templates, and review checklists.

## 1) Scope, audience, and success criteria

### Scope

- Primary code: `packages/lynx-ui-*`
- Aggregate exports: `packages/lynx-ui`
- Runtime examples: `apps/examples`
- Design foundation: `luna/`

### Audience

- AI agents that generate/refactor code and docs
- Human reviewers validating AI-generated patches

### Success criteria (for AI-generated changes)

1. New code looks and behaves like native lynx-ui code.
2. API additions are consistent with existing controlled/uncontrolled and composition patterns.
3. Docs follow the same structure as current package READMEs and SKILL documents.
4. Verification scope matches change scope (no missing export/docs/tests checks).

---

## 2) Component architecture map (what already exists in the repo)

Use this as a decision table before writing code.

### A. Stateless-ish interaction primitives

- **Example**: `Button`
- **Traits**:
  - press/active state management
  - render-props children support
  - state class hooks (`ui-active`, `ui-disabled`)
- **When to copy this pattern**:
  - you are building an interaction wrapper with minimal structure

### B. Selection controls (single/multi)

- **Examples**: `Checkbox`, `RadioGroup`
- **Traits**:
  - controlled + uncontrolled dual mode
  - context to share state with indicator sub-components
  - state-driven class hooks for styling systems
- **When to copy this pattern**:
  - selected/unselected or boolean state + indicator composition

### C. Layered floating/overlay systems

- **Examples**: `Dialog`, `Popover`, `Sheet`
- **Traits**:
  - Root/Trigger/View/Backdrop/Content decomposition
  - Presence-driven mount/unmount and animation state
  - overlay container level/placement concerns
- **When to copy this pattern**:
  - modal/pop layer/floating positioning/portal-like rendering

### D. Complex motion/gesture systems

- **Examples**: `Sheet`, `Swiper`, `Draggable`, `Sortable`, `SwipeAction`
- **Traits**:
  - internal hooks split by concern (gesture, snap, velocity, offset)
  - imperative capabilities where needed (`open`, `close`, `snapTo`, etc.)
  - strict separation of state model vs motion math/helpers
- **When to copy this pattern**:
  - drag/swipe physics or imperative control is required

### E. Data container/virtualized rendering

- **Examples**: `List`, `FeedList`
- **Traits**:
  - virtualization constraints
  - strong usage constraints documented in SKILL/README
- **When to copy this pattern**:
  - large data render performance-sensitive containers

---

## 3) API design standards (with concrete repo-backed examples)

## 3.1 Controlled + uncontrolled is the default for stateful Root components

For `show/checked/value`-style state, prefer:

- controlled props: `show | checked | value`
- uncontrolled props: `defaultShow | defaultChecked | defaultValue`
- change callback: `onShowChange | onChange | onValueChange`

### Canonical implementation skeleton

```ts
const isControlled = value !== undefined
const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue)
const actualValue = isControlled ? value : uncontrolledValue

const handleValueChange = useMemoizedFn((next) => {
  if (!isControlled) setUncontrolledValue(next)
  onValueChange?.(next)
})
```

### Existing component examples

- `Checkbox`: `checked/defaultChecked/onChange`
- `RadioGroupRoot`: `value/defaultValue/onValueChange`
- `DialogRoot`, `PopoverRoot`, `SheetRoot`: `show/defaultShow/...`

> Rule: if a new stateful component does not support controlled mode, explain why in PR description.

## 3.2 Composition over monolith

Prefer sub-components with explicit responsibilities:

- Dialog: `DialogRoot` + `DialogTrigger` + `DialogView` + `DialogBackdrop` + `DialogContent` + `DialogClose`
- Popover: `PopoverRoot` + `PopoverTrigger` + `PopoverAnchor` + `PopoverPositioner` + `PopoverContent` + `PopoverArrow`
- Sheet: `SheetRoot` + `SheetView` + `SheetBackdrop` + `SheetContent` + `SheetHandle`

> Rule: if a component has 2+ independent UI zones (trigger/panel/backdrop), split them into sub-components.

## 3.3 Context for shared state, render props for local dynamic styling

- Use **Context** for cross-sub-component state sharing.
  - Example: group value/disabled flowing from `RadioGroupRoot` to `Radio` and `RadioIndicator`.
- Use **render props** when children need immediate local state.
  - Example: `Button` children can receive `{ active, disabled }`.

> Heuristic:
>
> - same component tree, many children need state -> Context
> - single render slot needs state -> render props

## 3.4 Semantic state class hooks are mandatory for headless styling

Expose state through class hooks such as:

- `ui-active`
- `ui-disabled`
- `ui-checked`
- `ui-indeterminate`

These are not visual styles; they are integration points for consumers.

## 3.5 Passthrough props and naming consistency

Prefer passthrough prop names by sub-component identity:

- `buttonProps`
- `checkboxProps`
- `dialogViewProps`
- `popoverPositionerProps`

> Rule: do not use ambiguous names like `nativeProps` unless the component architecture genuinely has no specific target node.

## 3.6 Aggregate export discipline

When adding/modifying public APIs:

1. update package local `src/index.tsx`/`src/index.ts`
2. update aggregate `packages/lynx-ui/src/index.tsx` if the symbol should be public from `@lynx-js/lynx-ui`
3. keep type exports explicit

---

## 4) Code style standards (implementation-level, AI actionable)

## 4.1 Mandatory file header and language consistency

- Keep the existing copyright header in source files.
- Code comments must be in English.
- Repository/project name must be `lynx-ui` (lowercase).

## 4.2 Recommended package layout

```text
packages/lynx-ui-<component>/
  src/
    index.tsx
    <Component>.tsx
    types/
      index.ts
      index.docs.ts
  README.md
  SKILL.md (recommended for complex components)
```

## 4.3 Hook usage conventions

- Use `useMemoizedFn` for event callbacks with repeated binding points.
- Use `useMemo` for context values and derived objects.
- Use `useRef` for non-render state (last-emitted values, imperative method storage, etc.).
- Use `useEffect` to bridge controlled values/events when needed.

## 4.4 Conditional classes and style composition

- Use `clsx` for state class composition.
- Never hardcode final branded look in headless primitives.
- Preserve consumer styling freedom (`className`, `style`, and state hooks).

## 4.5 MTS and gesture-sensitive code

For gesture/animation-sensitive components:

- follow main-thread patterns already used in the repo (`'main thread'`, `main-thread:*`)
- isolate physics/math in hooks/utils
- avoid mixing imperative API control with rendering code in a single giant function

## 4.6 Error and boundary behavior

- If a sub-component must be used under a Root context, fail fast with clear errors.
  - Example pattern: `<Radio/> must be used within <RadioGroup/>!`
- Keep errors actionable and component-specific.

---

## 5) Documentation standards (README, SKILL, examples)

## 5.1 Package README structure (stable baseline)

Keep this order unless there is a strong reason not to:

1. `# @lynx-js/lynx-ui-<component>`
2. one-line capability statement (headless + what it solves)
3. `## Installation` (prefer `@lynx-js/lynx-ui`)
4. `## Usage` (+ examples link)
5. `## Component Structure` (JSX tree + role bullets)
6. `## About @lynx-js/lynx-ui`
7. `## License`

## 5.2 README writing rules

- Focus on behavior and composition, not specific design language.
- Explicitly show sub-component responsibilities for layered components.
- Provide direct links to `apps/examples/<Component>`.

## 5.3 SKILL guidance for AI (especially complex components)

Recommended SKILL sections:

1. Core Capabilities
2. AI Coding Guide (minimal runnable example)
3. Recommended Prompt Formula
4. Use Cases & Best Practices
5. FAQ
6. Sub components (if applicable)

For complex components (List/Sheet/Popover/Sortable/Swiper), SKILL should include:

- hard constraints (must/must not)
- common pitfalls
- debugging checklist
- migration hints when APIs are easy to misuse

## 5.4 Example app guidance

In `apps/examples`, prefer importing from `@lynx-js/lynx-ui` unless intentionally demonstrating package-level imports.

---

## 6) AI execution playbook (step-by-step)

Use this workflow for every AI task.

### Step 1: classify the request

- **New component** / **feature add** / **bug fix** / **docs only** / **refactor**
- decide whether API surface changes

### Step 2: find nearest pattern component

Before coding, choose a reference:

- interaction primitive -> Button
- boolean selection -> Checkbox
- single selection group -> RadioGroup
- overlay modal -> Dialog
- floating anchor placement -> Popover
- drag/snap overlay -> Sheet

### Step 3: design with compatibility first

- preserve existing prop names/events if extending
- prefer additive optional props
- if breaking change is unavoidable: include migration notes + changeset

### Step 4: implement in small, reviewable slices

Recommended order:

1. types
2. core state model (controlled/uncontrolled)
3. context + sub-components
4. styling hooks/class names
5. exports
6. docs/examples

### Step 5: verify by change type

- docs-only: spelling + formatting checks for changed docs
- package API change: build + exports checks + targeted examples/tests
- behavior change: component tests and/or runnable examples
- cross-package change: workspace-level checks

### Step 6: final PR quality gate

Before finalizing, verify:

- API consistency with nearest existing pattern
- aggregate export correctness
- docs updated where behavior/API changed
- changeset included for user-visible package changes

---

## 7) Verification matrix (what to run and when)

> Choose the smallest complete set based on change scope.

### Docs-only

- spell check changed markdown
- markdown formatting check (if environment allows)

### Single-package runtime/API change

- package build
- export check
- targeted tests/examples

### Multi-package or aggregate export change

- workspace build
- `check:exports`
- workspace checks/tests as needed

### Suggested command pool

- `pnpm build`
- `pnpm check:exports`
- `pnpm check:all`
- `pnpm test`
- `pnpm exec cspell lint <changed-docs>`

---

## 8) Anti-patterns to block in review

1. New stateful Root component without controlled mode (unless justified).
2. Collapsing layered architecture into one monolithic component.
3. Missing `className`/`style` passthrough on headless primitives.
4. Introducing private package imports in examples when aggregate import should be used.
5. Missing aggregate export updates after adding public symbols.
6. Doc updates omitted when API behavior changed.
7. Hardcoded visual branding in headless primitives.

---

## 9) Copyable templates for AI output

## 9.1 New component design checklist (copy/paste)

```md
- [ ] Has controlled + uncontrolled model (`value` + `defaultValue` + `onValueChange` style)
- [ ] Supports composition (Root + sub-components when needed)
- [ ] Provides context and/or render props intentionally
- [ ] Exposes semantic state class hooks
- [ ] Supports `className` / `style` / passthrough props
- [ ] Exports updated in package entry
- [ ] Exports updated in aggregate entry (if public)
- [ ] README updated
- [ ] SKILL updated/added when complexity warrants
- [ ] Changeset added for user-facing package change
```

## 9.2 Existing component enhancement checklist

```md
- [ ] Existing API compatibility verified
- [ ] New capability added via optional props first
- [ ] Event naming aligned with existing conventions
- [ ] Controlled/uncontrolled behavior remains stable
- [ ] Docs/examples updated for new behavior
- [ ] Migration notes added if any breaking change exists
```

---

## 10) Governance model to keep lynx-ui AI-friendly over time

Use a two-layer knowledge system:

1. **Repository layer (this file)**
   - cross-component standards and review gates
2. **Component layer (`packages/lynx-ui-*/SKILL.md`)**
   - scenario prompts, pitfalls, and component-specific constraints

Maintenance triggers:

- new cross-component pattern -> update this guide
- recurring component-specific issue -> update that component SKILL
- every API-affecting PR -> reviewer checks guide compliance explicitly

