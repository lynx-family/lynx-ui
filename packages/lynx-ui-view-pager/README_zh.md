# @lynx-js/lynx-ui-view-pager

适用于 ReactLynx 的分页横向内容导航组件，支持屏外页面懒加载。

## 安装

```bash
pnpm add @lynx-js/lynx-ui
```

也可以单独安装 `@lynx-js/lynx-ui-view-pager`。

## 使用

```tsx
import { ViewPager } from '@lynx-js/lynx-ui'

<ViewPager
  data={[{ id: 'first', title: 'First' }, { id: 'second', title: 'Second' }]}
  getItemKey={page => page.id}
  itemStyle={{ width: '100%', height: '100%' }}
  style={{ width: '100%', height: '400px' }}
>
  {page => <text>{page.title}</text>}
</ViewPager>
```

[查看示例](https://github.com/lynx-family/lynx-ui/tree/main/apps/examples/ViewPager)

## 许可证

[lynx-ui](https://github.com/lynx-family/lynx-ui) 基于 [Apache License 2.0](./LICENSE) 许可发布。
