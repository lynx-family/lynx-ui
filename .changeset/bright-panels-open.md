---
"@lynx-js/lynx-ui-sheet": minor
"@lynx-example/lynx-ui-sheet": patch
---

Expose `initialInsets` and `initialCornerRadius` with `main-thread:surfaceControllerRef` for Sheet surface geometry, and replace `commitInsets()` with safe-by-default `setInsets(insets, { animating })` deferred settlement during animations.
