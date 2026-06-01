# Motion

Read this file when choosing between motion and motion-mini or combining motion with lynx-ui components.

## Official docs

- Motion: `https://lynxjs.org/next/lynx-ui/motion.html`
- Motion Mini: `https://lynxjs.org/next/lynx-ui/motion-mini.html`

## Comparison

| Capability | Motion | Motion Mini |
|---|---|---|
| Value types | numbers, colors, unit strings, keyframes | numbers only |
| Motion values | `motionValue()` | `useMotionValueRef()` |
| Style workflow | higher-level helpers such as `styleEffect()` | explicit style updates |
| Bundle/runtime tradeoff | larger, more capable | smaller, simpler |

Use motion for richer value types or derived styles. Use motion-mini for small numeric transitions where explicit style writes are acceptable.

## Motion pattern

```tsx
import { animate, motionValue, styleEffect } from '@lynx-js/motion';

const x = motionValue(0);
styleEffect(node, {
  transform: x,
});
animate(x, 100, { duration: 0.3 });
```

## Motion-mini pattern

```tsx
import { animate, useMotionValueRef, useMotionValueRefEvent } from '@lynx-js/motion/mini';

const x = useMotionValueRef(0);

useMotionValueRefEvent(x, 'change', (value) => {
  node.setStyleProperties({
    transform: `translateX(${value}px)`,
  });
});

animate(x.current, 100, {
  type: 'spring',
  stiffness: 200,
  damping: 20,
});
```

## Constraints

- Preserve main-thread refs and main-thread-bound handlers for high-frequency interaction work.
- Verify support before using web-oriented Motion APIs such as `scroll()`, `inView()`, `hover()`, or `press()`.
- Verify component props in generated API references when combining motion with a component.
