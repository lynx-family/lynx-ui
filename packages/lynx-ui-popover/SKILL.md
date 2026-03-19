# Lynx UI Popover SKILL

`lynx-ui-popover` is a headless primitive for building accessible, positioned floating elements. It handles the complex logic of positioning, stacking context, and enter/exit animations via `usePresence`.

## 1. Core Capabilities

- **Headless & Composable**: Provides raw functional components (`Root`, `Trigger`, `Positioner`, `Content`) that you compose to build custom UIs.
- **Auto Positioning**: The `PopoverPositioner` automatically calculates coordinates to anchor the popover to the trigger.
- **Presence Animations**: Integrated with `usePresence` lifecycle. Components mount/unmount with `entering`/`leaving` states, allowing for CSS animations.
- **Robust Visibility Modes**: Supports **Controlled** (external state) and **Uncontrolled** (internal state) modes with predictable behavior.

## 2. Behavior Contract

### Visibility Modes

- **Controlled**: Parent passes `show` prop and handles `onVisibleChange` callback.
- **Uncontrolled**: Parent passes `defaultShow`; component manages internal state.

### Presence Lifecycle

- **States**: Transitions through `Entering` -> `DelayedEntering` -> `Entered` -> `Leaving` -> `Left`.
- **Animation Safety**: Handles animation/transition **start**, **end**, and **cancel** events to ensure state never stalls.
- **Debugging**: Enable `debugLog={true}` on `PopoverRoot` to trace lifecycle state changes in the console.

### Interactions

- **Trigger**: Toggles visibility on click/tap.
- **Backdrop**: Closes popover (sets visibility to `false`) on tap. Respects "busy" lifecycle states (e.g., won't close if already animating out).

## 3. AI Coding Guide

### Minimal Usable Example

**Crucial**: Wrap `Content` and `Arrow` inside `PopoverPositioner`. Apply layout/animation styles to `Positioner`, and visual styles (background, border) to `Content`.

```tsx
import {
  PopoverRoot,
  PopoverTrigger,
  PopoverPositioner,
  PopoverContent,
  PopoverArrow,
  PopoverBackdrop,
} from '@lynx-js/lynx-ui'
import './style.css'

export default function App() {
  return (
    <PopoverRoot>
      <PopoverTrigger className='trigger'>
        <text>Open Popover</text>
      </PopoverTrigger>

      {/* Positioner handles layout and animation */}
      <PopoverPositioner className='popover-positioner' placement='bottom'>
        <PopoverBackdrop className='popover-backdrop' />
        {/* Content handles visual appearance */}
        <PopoverContent className='popover-content'>
          <text>My Popover</text>
          <PopoverArrow className='popover-arrow' />
        </PopoverContent>
      </PopoverPositioner>
    </PopoverRoot>
  )
}
```

### Recommended Prompt Formula

> **Goal**: Build a lynx-ui Popover using [controlled|uncontrolled] mode.
> **Components**: Include [Trigger], [Positioner], [Content], and optional [Backdrop/Anchor/Arrow].
> **Behavior**: Define transition [name] and set [debugLog on/off].
> **Styling Requirements**:
>
> 1. **DO** set `opacity: 0` / `scale(0)` on `.ui-closed` class (prevents flashing after exit animation).
> 2. Use CSS keyframes or transitions for enter/exit.

## 4. Use Cases & Best Practices

### Scenario 1: Animation Best Practices (Prevent Flashing)

**Problem (Exit Flash)**: When the exit animation finishes, the `ui-leaving` class is removed immediately, but the element might remain visible for one frame before `visibility: hidden` is applied.
**Solution**: Explicitly hide the element in the `ui-closed` state.

```css
/* style.css */
.popover-positioner {
  display: flex;
}

/* Entering State: Mounted -> Visible */
.popover-positioner.ui-entering {
  animation: fade-in 0.2s ease-out forwards;
}

/* Leaving State: Visible -> Unmounted */
.popover-positioner.ui-leaving {
  animation: fade-out 0.2s ease-in forwards;
}

/* Closed State: Hidden */
/* Crucial: Prevents a flash of unstyled content after exit animation ends but before unmount */
.popover-positioner.ui-closed {
  opacity: 0;
  transform: scale(0);
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes fade-out {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.9);
  }
}
```

### Scenario 2: Synchronized Arrow Animation

**Problem**: If you animate `PopoverContent` but `PopoverArrow` is outside or has its own animation, they might detach or look disconnected during scale/fade.
**Solution**: Apply the animation class to their common parent, `PopoverPositioner`.

```tsx
<PopoverPositioner className='popover-anim-container'>
  <PopoverContent className='popover-visual-box'>
    <text>Content</text>
  </PopoverContent>
  <PopoverArrow />
</PopoverPositioner>
```

## 5. FAQ

**Q: Why doesn't the Arrow animate with the Content?**
A: Ensure you are animating the `PopoverPositioner` (which contains both), not just the `PopoverContent`.

**Q: Can I use CSS Transitions instead of Animations?**
A: Yes, and it is often smoother for simple fades because transitions interpolate from the _current_ value when interrupted, whereas animations reset.

## 6. Sub Components

- **PopoverRoot**: Context provider, manages visibility state.
- **PopoverTrigger**: The element that toggles the popover.
- **PopoverPositioner**: The floating container that positions itself relative to the trigger. **Apply animations here.**
- **PopoverContent**: The visual box for your content.
- **PopoverArrow**: The triangle pointing to the trigger.
- **PopoverBackdrop**: An overlay behind the popover (often used for dimming or click-outside).
