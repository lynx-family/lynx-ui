# @lynx-js/lynx-ui-scroll-coordinator

用于 ReactLynx 的无样式滚动协调组件，支持可折叠头部与嵌套列表、滚动视图、分页内容联动。

## 安装

```bash
pnpm add @lynx-js/lynx-ui
```

也可单独安装 `@lynx-js/lynx-ui-scroll-coordinator`。

## 组件结构

`ScrollCoordinator` 组合可折叠的 `headers`、常驻 `toolbar` 和滚动内容 `slot`，支持整体刷新、分页内刷新、双线程偏移回调及命令式头部导航。

- [示例](../../apps/examples/ScrollCoordinator)
- [ViewPager 每页嵌套 List](../../apps/examples/ScrollCoordinator/ViewPagerList)
- [API 文档](./docs/APIReference.mdx)
- [组件使用指南](./SKILL.md)

## 许可证

[Apache License 2.0](./LICENSE)
