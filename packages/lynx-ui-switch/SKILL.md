---
name: lynx-ui-switch
description: Build headless controlled or uncontrolled Lynx switches with custom track and thumb composition, disabled behavior, render state, and state-aware styling.
---

# lynx-ui Switch SKILL

Use `Switch` for an immediate boolean setting. It owns interaction semantics while the application supplies the track, thumb, and visual styling. Import from `@lynx-js/lynx-ui` in OSS applications.

## Core Capabilities

- Supports controlled (`checked`) and uncontrolled (`defaultChecked`) state.
- Composes optional `SwitchTrack` and `SwitchThumb` visual slots.
- Propagates checked, active, and disabled state to the root, track, and thumb.
- Accepts render-function children for fully custom state-dependent content.
- Passes raw Lynx view props, such as hit slop, through `switchProps`.

## AI Coding Guide

### Minimal Usable Example

```tsx
import { useState } from '@lynx-js/react'
import { Switch, SwitchThumb, SwitchTrack } from '@lynx-js/lynx-ui'

function NotificationsSwitch() {
  const [checked, setChecked] = useState(true)

  return (
    <Switch className='setting-switch' checked={checked} onChange={setChecked}>
      <SwitchTrack className='setting-switch__track' />
      <SwitchThumb className='setting-switch__thumb' />
    </Switch>
  )
}
```

### Recommended Prompt Formula

> Setting meaning + controlled or uncontrolled state + dimensions + checked/pressed/disabled styling + hit area + change behavior.

## Use Cases & Best Practices

- Use `checked` with `onChange` when business state owns the value. Use `defaultChecked` for self-managed state.
- Treat `Switch` as headless: define the root size, track appearance, thumb size, and checked translation in package-namespaced CSS.
- Style state with `ui-checked`, `ui-active`, and `ui-disabled`; these classes are available on the root, track, and thumb.
- Use `switchProps` for raw view props such as an expanded hit area. Avoid overriding the component's gesture bindings there.
- Use a checkbox for multi-select or acknowledgement semantics. A switch represents a setting that takes effect immediately.

```css
.lynx-ui-settings__switch-thumb {
  transform: translateX(3px);
}

.lynx-ui-settings__switch-thumb.ui-checked {
  transform: translateX(23px);
}
```

Reference examples: `apps/examples/Switch/Basic` and `Themed`.

## FAQ

### Why does a controlled switch snap back after tapping?

`onChange` reports the next boolean but does not mutate the `checked` prop. Update the controlling state.

### Does Switch provide default visuals?

No product styling is assumed. Compose and style `SwitchTrack` and `SwitchThumb`, or render custom children from the state render function.

### How do I make the touch target larger than the visible control?

Pass the relevant raw view hit-slop props through `switchProps` while keeping visual styles on the component classes.

## Sub components

- `Switch`: Owns checked state and press behavior.
- `SwitchTrack`: Optional background/decorative layer.
- `SwitchThumb`: Optional movable handle.
