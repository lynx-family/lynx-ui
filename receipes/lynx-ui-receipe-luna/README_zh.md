# @lynx-js/lynx-ui-receipe-luna

受 Radix Themes 启发的实验性 ReactLynx 布局组件，作为 Luna recipe 的起点。

## 安装

```bash
npm install @lynx-js/lynx-ui-receipe-luna
```

## 组件

- `Box`：提供共用间距和尺寸属性的基础容器。
- `Flex`、`Row`、`Column`：支持对齐、换行和间距的 flex 布局。
- `Grid`：支持行列数量或轨道列表的原生 CSS grid。
- `Container`：居中且限制最大宽度的内容区域。
- `Section`：提供垂直留白的区块。

在应用边界设置 LUNA 主题。布局组件继承周围主题，不设置内容颜色。

详见 [API 文档](./docs/APIReference.mdx)、[编码指南](./SKILL.md) 和
[布局示例](../../apps/examples/ReceipeLuna/Basic/index.tsx)。
当前 `0.0.x` 版本为实验性入口，稳定发布前 API 可能调整。
