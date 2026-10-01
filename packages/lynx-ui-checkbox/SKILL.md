---
name: lynx-ui-checkbox
description: Build headless controlled, uncontrolled, disabled, and indeterminate checkboxes with custom Lynx content and state-aware styling.
---

# lynx-ui Checkbox SKILL

Use `Checkbox` when a boolean choice needs press behavior and state management but the product owns the visual design. Import it from `@lynx-js/lynx-ui` in OSS applications.

## Core Capabilities

- Supports controlled (`checked`) and uncontrolled (`defaultChecked`) state.
- Supports checked, unchecked, indeterminate, pressed, and disabled states.
- Exposes `CheckboxIndicator` for conditionally mounted check or mixed-state marks.
- Accepts plain children or a render function that receives the current state.
- Passes raw Lynx view props, such as hit slop, through `checkboxProps`.

## AI Coding Guide

### Minimal Usable Example

```tsx
import { useState } from '@lynx-js/react'
import { Checkbox, CheckboxIndicator } from '@lynx-js/lynx-ui'

function AgreementCheckbox() {
  const [checked, setChecked] = useState(false)

  return (
    <Checkbox
      className='agreement-checkbox'
      checked={checked}
      onChange={setChecked}
    >
      <CheckboxIndicator className='agreement-checkbox__indicator'>
        <text>✓</text>
      </CheckboxIndicator>
      <text>I agree to the terms</text>
    </Checkbox>
  )
}
```

### Recommended Prompt Formula

> Checkbox purpose + controlled or uncontrolled state + checked/mixed/disabled appearance + hit area + change behavior.

## Use Cases & Best Practices

- Use `checked` with `onChange` when application state is authoritative. Use `defaultChecked` only for self-managed state.
- Put the label inside `Checkbox` when the entire row should be pressable. Use `checkboxProps` for raw view behavior such as an expanded hit area.
- Style state with `ui-checked`, `ui-indeterminate`, `ui-active`, and `ui-disabled`, or use render-function children for state-dependent content.
- `CheckboxIndicator` mounts its children only while checked or indeterminate. Set `forceMount` when exit animation or layout stability requires the mark to remain mounted.
- When `indeterminate` is true, the next press resolves the value to `true`; the parent still owns the `indeterminate` prop.

```tsx
<Checkbox
  checked={allSelected}
  indeterminate={someSelected && !allSelected}
  onChange={checked => setSelected(checked ? allIds : [])}
>
  <CheckboxIndicator className='select-all__indicator'>
    {someSelected && !allSelected ? <text>−</text> : <text>✓</text>}
  </CheckboxIndicator>
  <text>Select all</text>
</Checkbox>
```

Reference examples: `apps/examples/Checkbox/Basic` and `Indeterminate`.

## FAQ

### Why does a controlled checkbox not change after tapping it?

`onChange` reports the next value; update the state passed to `checked` in that callback.

### Why is the indicator content absent while unchecked?

That is the default slot behavior. Use `forceMount` when the content must always exist and hide it with state-aware CSS instead.

## Sub components

- `Checkbox`: Owns press behavior and checked-state semantics.
- `CheckboxIndicator`: Renders the custom check or indeterminate mark.
