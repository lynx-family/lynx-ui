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
import type { TabsData } from '@lynx-js/lynx-ui'
import './index.css'

const tabs: TabsData<string>[] = [
  { tabItem: '首页', getTabKey: () => 'home' },
  { tabItem: '个人资料', getTabKey: () => 'profile' },
]

export function App() {
  return (
    <TabsRoot>
      <TabsBar
        data={tabs}
        renderTabItem={item => (
          <TabsItem key={item.getTabKey()} tabKey={item.getTabKey()}>
            <text>{item.tabItem}</text>
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
