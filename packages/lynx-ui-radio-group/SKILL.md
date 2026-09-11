---
name: lynx-ui-radio-group
description: Build headless single-choice radio groups with controlled or uncontrolled value, group and item disabling, custom indicators, and state-aware styling.
---

# lynx-ui Radio Group SKILL

Use `RadioGroupRoot`, `Radio`, and `RadioIndicator` when exactly one value from a set may be selected. Import them from `@lynx-js/lynx-ui` in OSS applications.

## Core Capabilities

- Supports controlled (`value`) and uncontrolled (`defaultValue`) selection.
- Coordinates mutually exclusive `Radio` items by string value.
- Disables either the whole group or individual items.
- Conditionally renders custom indicator content for the selected item.
- Exposes checked, active, and disabled classes for state-aware styling.

## AI Coding Guide

### Minimal Usable Example

```tsx
import { useState } from '@lynx-js/react'
import { Radio, RadioGroupRoot, RadioIndicator } from '@lynx-js/lynx-ui'

function PlanPicker() {
  const [plan, setPlan] = useState('free')

  return (
    <RadioGroupRoot value={plan} onValueChange={setPlan}>
      {['free', 'pro'].map(value => (
        <Radio key={value} value={value} className='plan-option'>
          <RadioIndicator className='plan-option__indicator'>
            <view className='plan-option__dot' />
          </RadioIndicator>
          <text>{value}</text>
        </Radio>
      ))}
    </RadioGroupRoot>
  )
}
```

### Recommended Prompt Formula

> Choice data and stable values + controlled or uncontrolled mode + group/item disabled rules + indicator and row appearance + change behavior.

## Use Cases & Best Practices

- Give each `Radio` a unique, stable string `value`; selection is determined by equality with the root value.
- In controlled mode, update `value` from `onValueChange`. Use `defaultValue` only when the group should own state.
- `disabled` on `RadioGroupRoot` blocks every item; `disabled` on `Radio` blocks only that option.
- Keep `Radio` inside `RadioGroupRoot`; the item and indicator depend on group context.
- `RadioIndicator` mounts its children only for the selected item. Use `forceMount` for transitions or a persistent indicator shell.
- Use `radioProps` for raw view behavior such as hit slop. Put the label inside `Radio` when the entire option row should be pressable.

Reference examples: `apps/examples/RadioGroup/Basic` and `Disabled`.

## FAQ

### Why does the selected item revert after a tap?

The group is controlled when `value` is present. Persist the value received by `onValueChange` and pass it back to the root.

### Why is the indicator child missing on unselected items?

Conditional mounting is intentional. Set `forceMount` and style with `ui-checked` if the child must remain mounted.

### Can more than one item be selected?

No. Use independent `Checkbox` components for multi-select behavior.

## Sub components

- `RadioGroupRoot`: Owns or receives the selected value.
- `Radio`: A selectable item identified by its `value`.
- `RadioIndicator`: The custom selected-state mark.
