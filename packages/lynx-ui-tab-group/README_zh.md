# @lynx-js/lynx-ui-tab-group

用于通过 lynx-ui 构建标签导航的可组合 Tab 原语。此软件包提供 `TabsRoot`、`TabsBar`、`TabsItem`、`TabsIndicator`，以及可选的可滑动 `TabsPanel`。

## 安装

```bash
pnpm add @lynx-js/lynx-ui
```

## 基础用法

```tsx
import { root } from '@lynx-js/react'
import {
  TabsBar,
  TabsIndicator,
  TabsItem,
  TabsRoot,
} from '@lynx-js/lynx-ui'
const tabs = [
  { id: 'home', label: '首页' },
  { id: 'profile', label: '个人资料' },
]

export function App() {
  return (
    <TabsRoot>
      <TabsBar
        data={tabs}
        getTabKey={item => item.id}
        renderTabItem={(item, tabKey) => (
          <TabsItem key={tabKey} tabKey={tabKey}>
            <text>{item.label}</text>
          </TabsItem>
        )}
      >
        <TabsIndicator />
      </TabsBar>
    </TabsRoot>
  )
}

root.render(<App />)
```

完整示例请参阅 [TabGroup examples](https://github.com/lynx-family/lynx-ui/tree/main/apps/examples/TabGroup)。

## 许可证

Apache-2.0
