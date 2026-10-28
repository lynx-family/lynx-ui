# @lynx-js/lynx-ui-tab-group

## 3.140.2

### Patch Changes

- Use `ComponentBasicProps` instead of native `StandardProps` for `TabsItemProps` and its deprecated `TabItemProps` alias. Keep tab content available through an explicit `children` prop. ([#372](https://github.com/lynx-family/lynx-ui/pull/372))

## 3.140.1

### Patch Changes

- Export `TabsItemProps` as the canonical props type for `TabsItem` and retain ([#355](https://github.com/lynx-family/lynx-ui/pull/355))
  `TabItemProps` as a deprecated compatibility alias.
- Updated dependencies [[`20f5316`](https://github.com/lynx-family/lynx-ui/commit/20f531645f7c0e6766269d15129de93f53d9c8ea), [`20f5316`](https://github.com/lynx-family/lynx-ui/commit/20f531645f7c0e6766269d15129de93f53d9c8ea)]:
  - @lynx-js/lynx-ui-scroll-view@3.140.1
  - @lynx-js/lynx-ui-view-pager@3.140.1

## 3.139.0

### Minor Changes

- Add composable TabGroup primitives for tab navigation and animated indicators. ([#273](https://github.com/lynx-family/lynx-ui/pull/273))

- Add TabsPanel with ViewPager integration for synchronized tab selection and swipeable content. ([#290](https://github.com/lynx-family/lynx-ui/pull/290))

### Patch Changes

- Updated dependencies [[`18d4559`](https://github.com/lynx-family/lynx-ui/commit/18d4559bde1fff0f316d45f43c1eb47b935f9557), [`1a4ad19`](https://github.com/lynx-family/lynx-ui/commit/1a4ad190993d57425b4c377a7dd63882cc65a8d2)]:
  - @lynx-js/lynx-ui-view-pager@3.139.0
  - @lynx-js/lynx-ui-common@3.139.0
  - @lynx-js/lynx-ui-scroll-view@3.139.0
