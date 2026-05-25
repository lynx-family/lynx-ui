# Motion

Read this file when the task involves animation, transitions, gestures, or deciding between motion and motion-mini.

## Official docs

- Motion: `https://lynxjs.org/next/lynx-ui/motion.html`
- Motion Mini: `https://lynxjs.org/next/lynx-ui/motion-mini.html`

## Quick recommendation

- Use full motion when the task needs richer value types, derived styles, or a more capable motion workflow.
- Use motion-mini when the task is a small numeric transition and smaller runtime matters more than higher-level convenience.

## Comparison

| Capability | Motion | Motion Mini |
|---|---|---|
| Value types | numbers, colors, unit strings, keyframes | numbers only |
| Motion values | `motionValue()` | `useMotionValueRef()` |
| Style workflow | higher-level helpers such as `styleEffect()` | you write the final style updates yourself |
| Bundle/runtime tradeoff | larger, more capable | smaller, simpler |

## Full motion pattern

The docs emphasize main-thread refs and starting animation from a main-thread function.

```tsx
import { animate, motionValue, styleEffect } from '@lynx-js/motion';

const x = motionValue(0);
styleEffect(node, {
  transform: x,
});
animate(x, 100, { duration: 0.3 });
```

Use this style when the task benefits from richer animated values or derived styles.

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

Use this when the task only needs a small numeric animation and explicit style writes are acceptable.

## Main-thread guidance

The docs call out main-thread refs and main-thread-bound handlers for high-frequency interaction work. Keep that architecture intact instead of rewriting it into a generic web animation pattern.

## Unsupported web-only assumptions

Do not assume web-only Motion APIs such as `scroll()`, `inView()`, `hover()`, or `press()` are supported here if the official Lynx UI motion docs do not support them.

## Output style

- State which package you chose and why.
- Link the relevant official docs page.
- Keep the implementation close to the official motion pattern.
- Explain the tradeoff only as much as needed for the user’s task.
- If a motion example depends on exact local component props, verify that part in the generated component references too.
