# @lynx-js/lynx-ui-scroll-view

## 3.132.0

### Minor Changes

- Add `enableRTL` support for horizontal bounce and refresh interactions. ([#160](https://github.com/lynx-family/lynx-ui/pull/160))

## 3.131.0

### Minor Changes

- Migrate bounce and refresh hooks from common to ScrollView and FeedList. ([#119](https://github.com/lynx-family/lynx-ui/pull/119))

  **BREAKING CHANGE**: `useBounce` and `useRefreshAndBounce` hooks are no longer exported from `@lynx-js/lynx-ui-common`.

### Patch Changes

- Updated dependencies [[`bc167c5`](https://github.com/lynx-family/lynx-ui/commit/bc167c5d03cdb344156e897c4d2d69f95bf7d29b)]:
  - @lynx-js/lynx-ui-common@3.131.0
  - @lynx-js/lynx-ui-lazy-component@3.131.0

## 3.130.0

### Minor Changes

- Add `iosScrollsToTop` prop, mapped to underlying ios-scrolls-to-top in <list/>. Only passed down when explicitly provided. ([#79](https://github.com/lynx-family/lynx-ui/pull/79))

  Add `enableScroll` prop to `ScrollView`, mapped to underlying `enable-scroll` on <scroll-view/>. Default is `true`.

### Patch Changes

- optimize: fix type errors ([#79](https://github.com/lynx-family/lynx-ui/pull/79))

- Update files field in all packages to include LICENSE file. ([#79](https://github.com/lynx-family/lynx-ui/pull/79))

- Fix `scrollOrientation` prop by making it optional instead of required. ([#79](https://github.com/lynx-family/lynx-ui/pull/79))

- Updated dependencies [[`bc1d954`](https://github.com/lynx-family/lynx-ui/commit/bc1d9544d25c5483f5bf199dd279094b8d669520), [`bc1d954`](https://github.com/lynx-family/lynx-ui/commit/bc1d9544d25c5483f5bf199dd279094b8d669520), [`bc1d954`](https://github.com/lynx-family/lynx-ui/commit/bc1d9544d25c5483f5bf199dd279094b8d669520), [`bc1d954`](https://github.com/lynx-family/lynx-ui/commit/bc1d9544d25c5483f5bf199dd279094b8d669520), [`bc1d954`](https://github.com/lynx-family/lynx-ui/commit/bc1d9544d25c5483f5bf199dd279094b8d669520), [`bc1d954`](https://github.com/lynx-family/lynx-ui/commit/bc1d9544d25c5483f5bf199dd279094b8d669520), [`bc1d954`](https://github.com/lynx-family/lynx-ui/commit/bc1d9544d25c5483f5bf199dd279094b8d669520)]:
  - @lynx-js/lynx-ui-common@3.130.0
  - @lynx-js/lynx-ui-lazy-component@3.130.0
