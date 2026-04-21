# @lynx-js/lynx-ui-common

## 3.131.0

### Minor Changes

- Migrate bounce and refresh hooks from common to ScrollView and FeedList. ([#119](https://github.com/lynx-family/lynx-ui/pull/119))

  **BREAKING CHANGE**: `useBounce` and `useRefreshAndBounce` hooks are no longer exported from `@lynx-js/lynx-ui-common`.

## 3.130.0

### Patch Changes

- Fix an issue where using ReactiveValue causes an MTS error ([#79](https://github.com/lynx-family/lynx-ui/pull/79))

- Migrate away from `@/` imports. ([#79](https://github.com/lynx-family/lynx-ui/pull/79))

- optimize: fix type errors ([#79](https://github.com/lynx-family/lynx-ui/pull/79))

- Update files field in all packages to include LICENSE file. ([#79](https://github.com/lynx-family/lynx-ui/pull/79))

- fix: add a default fallback for dragEndVelocity for useRefresh. ([#79](https://github.com/lynx-family/lynx-ui/pull/79))

- fix: add a default fallback for dragEndVelocity; otherwise the condition is invalid when the user clicks LynxView to skip to another page. ([#79](https://github.com/lynx-family/lynx-ui/pull/79))
