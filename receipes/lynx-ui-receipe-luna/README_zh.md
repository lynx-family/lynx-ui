# @lynx-js/lynx-ui-receipe-luna

实验性的 ReactLynx 布局与主题组件。布局组件受 Radix Themes 启发。

## 安装

```bash
npm install @lynx-js/lynx-ui-receipe-luna @lynx-js/luna-styles
```

## 组件

- `Box`：提供共用间距和尺寸属性的基础容器。
- `Flex`、`Row`、`Column`：支持对齐、换行和间距的 flex 布局。
- `Grid`：支持行列数量或轨道列表的原生 CSS grid。
- `Container`：居中且限制最大宽度的内容区域。
- `Section`：提供垂直留白的区块。
- `LunaThemeScope`：为子树设置 LUNA 主题。
- `LunaButton`：提供实色和柔和两种外观的文字按钮。
- `LunaSwitch`：内置轨道与滑块的开关。

在 ReactLynx 插件中启用 `enableCSSSelector` 和 `enableCSSInheritance`，
在应用中导入 `@lynx-js/luna-styles/index.css`，再用
`<LunaThemeScope themeKey='lunaris-dark'>` 包裹页面或局部区域。按钮和开关从最近的
主题作用域继承 CSS 变量，切换主题时保留交互状态。

详见 [API 文档](./docs/APIReference.mdx)、[编码指南](./SKILL.md) 和
[布局示例](../../apps/examples/ReceipeLuna/Basic/index.tsx)、
[主题切换示例](../../apps/examples/ReceipeLuna/ThemedControls/index.tsx)。
此入口为实验性功能，API 可能调整。
