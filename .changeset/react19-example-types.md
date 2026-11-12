---
"@lynx-example/lynx-ui-swiper": patch
"@lynx-example/lynx-ui-dialog": patch
---

Fix example source type checks with React 18 and React 19. Swiper now imports
scoped JSX types from ReactLynx, and the Dialog overlay-level state follows the
public prop contract.

See [lynx-ui #398](https://github.com/lynx-family/lynx-ui/issues/398) and
[lynx-website #1738](https://github.com/lynx-family/lynx-website/issues/1738).
