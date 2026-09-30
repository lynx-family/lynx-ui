# @lynx-js/lynx-ui-deferred-component

## 3.139.0

### Minor Changes

- Add DeferredComponent to defer rendering children until after layout, with configurable frame delays, estimated sizing, placeholders, and layout notifications. ([#301](https://github.com/lynx-family/lynx-ui/pull/301))

  Render children immediately for non-finite frame delays to avoid scheduling an endless animation-frame loop.

### Patch Changes

- Updated dependencies [[`1a4ad19`](https://github.com/lynx-family/lynx-ui/commit/1a4ad190993d57425b4c377a7dd63882cc65a8d2)]:
  - @lynx-js/lynx-ui-common@3.139.0
