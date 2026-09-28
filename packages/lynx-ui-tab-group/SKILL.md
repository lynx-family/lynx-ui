# lynx-ui TabGroup SKILL

## Core Capabilities

`@lynx-js/lynx-ui-tab-group` provides composable tab-navigation primitives: `TabsRoot`, `TabsBar`, `TabsItem`, `TabsIndicator`, and the optional swipeable `TabsPanel`.

## Minimal Usable Example

```tsx
import { TabsBar, TabsIndicator, TabsItem, TabsPanel, TabsRoot } from '@lynx-js/lynx-ui'
import type { TabsData } from '@lynx-js/lynx-ui'

<TabsRoot>
  <TabsBar data={tabs} renderTabItem={item => (
    <TabsItem key={item.getTabKey()} tabKey={item.getTabKey()}>
      <text>{item.tabItem}</text>
    </TabsItem>
  )}>
    <TabsIndicator />
  </TabsBar>
  <TabsPanel data={pages} getItemKey={page => page.id}>
    {page => <Page page={page} />}
  </TabsPanel>
</TabsRoot>
```

`TabsPanel` is optional. It uses ViewPager's data and render-function contract
and creates native page items internally. Omit it when coordinating content
elsewhere through `onTabChanged`.

## Recommended Prompt Formula

Describe the tab-navigation scenario, the tab data and stable keys, the desired
layout and visual treatment, and whether content should use the synchronized
`TabsPanel` or be coordinated through callbacks.

## Best Practices

- Give every item a stable, unique value from `getTabKey`.
- Render `TabsIndicator` as a child of `TabsBar`.
- Use `TabsPanel` for synchronized swipeable content, or `onTabChanged` to coordinate content rendered elsewhere.
- Configure `indicatorAnimation` on `TabsRoot` for custom indicator motion.
