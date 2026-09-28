# @lynx-js/lynx-ui-scroll-coordinator

A headless collapsible header that coordinates scrolling with nested lists, scroll views, and paged content in ReactLynx.

## Installation

```bash
pnpm add @lynx-js/lynx-ui
```

The standalone package is also available as `@lynx-js/lynx-ui-scroll-coordinator`.

## Structure

`ScrollCoordinator` combines a collapsible `headers` region, a persistent `toolbar`, and a scrollable `slot`. It supports outer and per-page pull-to-refresh, offset callbacks on both threads, and imperative header navigation.

- [Examples](../../apps/examples/ScrollCoordinator)
- [ViewPager with a List in each page](../../apps/examples/ScrollCoordinator/ViewPagerList)
- [API reference](./docs/APIReference.mdx)
- [Component guidance](./SKILL.md)

## License

[Apache License 2.0](./LICENSE)
