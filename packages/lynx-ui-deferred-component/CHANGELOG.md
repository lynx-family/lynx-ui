# @lynx-js/lynx-ui-deferred-component

## 3.141.1

### Patch Changes

- Accept React 18 and newer types. ReactLynx still defines the compatible versions for each app. ([#383](https://github.com/lynx-family/lynx-ui/pull/383))

- Updated dependencies [[`49cb3c5`](https://github.com/lynx-family/lynx-ui/commit/49cb3c5b20d9346ff0f8b314367b4c8e354d195d)]:
  - @lynx-js/lynx-ui-common@3.141.1

## 3.140.1

### Patch Changes

- Keep implementation-only component signatures out of public documentation ([#355](https://github.com/lynx-family/lynx-ui/pull/355))
  types.

## 3.139.0

### Minor Changes

- Add DeferredComponent to defer rendering children until after layout, with configurable frame delays, estimated sizing, placeholders, and layout notifications. ([#301](https://github.com/lynx-family/lynx-ui/pull/301))

  Render children immediately for non-finite frame delays to avoid scheduling an endless animation-frame loop.

### Patch Changes

- Updated dependencies [[`1a4ad19`](https://github.com/lynx-family/lynx-ui/commit/1a4ad190993d57425b4c377a7dd63882cc65a8d2)]:
  - @lynx-js/lynx-ui-common@3.139.0
