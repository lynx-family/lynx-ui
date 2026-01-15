---
name: LazyComponent
description: Provide the information about the `<LazyComponent>`. Show the common use cases, basic usage, and critical development Advises.
---

# Lynx UI LazyComponent SKILL.md

`<LazyComponent>` is a component that lazy loads the content when it is visible in the viewport.

## 1. Common Use Cases

- **Offscreen rendering in scrollable containers**: Display the content of the page only when it is visible in the viewport of scrollable containers such as `<ScrollView>`, `<List>`, `<FeedList>`, etc. Usually used for speed up the initial loading time.
- **Virtualized List**: Embed `<LazyComponent>` in the slot of `<ScrollView>` so that the content of the items are only loaded when they are visible in the viewport.

## 2. Basic Usage

`<LazyComponent>` is used to display the content of the page only when it is visible in the viewport.

```tsx
import { LazyComponent } from '@lynx-js/lynx-ui-lazy-component'

function App() {
  return (
    <view>
      <LazyComponent
        scene={'scene'}
        pid={'pid'}
        estimatedStyle={{ width: '1px', height: '1px' }}
      >
        <RealItem />
      </LazyComponent>
    </view>
  )
}
```

## 3. Example for build Virtualized-List

You can build a virtualized list by embedding `<LazyComponent>` in the slot of `<ScrollView>`.

```tsx
import { LazyComponent } from '@lynx-js/lynx-ui-lazy-component'
import { ScrollView } from '@lynx-js/lynx-ui-scroll-view'

function App() {
  return (
    <ScrollView
      scrollOrientation='vertical'
      lazyOptions={{ enableLazy: false }}
      style={{ width: '100%', height: '400px' }}
    >
      {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        [...Array(20)]
          .map((_, index) => index)
          .map((_item, index) => (
            <LazyComponent
              key={index}
              scene={'scene'}
              pid={`pid_${index}`}
              estimatedStyle={{ width: '100%', height: '100px' }} // make sure the estimated size is equal to the real size
              unloadable
            >
              <view
                style={{
                  width: '100%',
                  height: `${300 + index * 10}px`,
                  padding: '5px',
                  border: '50px red',
                }}
              >
                <text>item</text>;
              </view>
            </LazyComponent>
          ))
      }
    </ScrollView>
  )
}
```

## 4. Example for adjust exposure-margin

You can adjust the exposure margin of `<LazyComponent>` by setting the `bottom`, `top`, `left`, and `right` props. So that the content of the item is loaded earlier than it is visible in the viewport.

```tsx
import { LazyComponent } from '@lynx-js/lynx-ui-lazy-component'

function App() {
  return (
    <view>
      <LazyComponent
        scene={'scene'}
        pid={'pid'}
        bottom='200px'
        top='200px'
        left='200px'
        right='200px'
        estimatedStyle={{ width: '1px', height: '1px' }}
      >
        <RealItem />
      </LazyComponent>
    </view>
  )
}
```

## 5. Critical Development Advises

- **MUST**: The `estimatedStyle` prop is required. It is an object that specifies the estimated size of the content of the item. The estimated size could be equal to or smaller than the real size of the content.
- **MUST**: The `scene` and `pid` props are required. They are used to identify the item. Their combination must be unique.
- **NOTICE**: The rule of `bottom`, `top`, `left`, and `right` props is that to expand the exposure margin of the item. The default value is `0px`.
- **NOTICE**: The `unloadable` prop is used to specify whether the content of the item is unloadable. If it is set to `true`, the content of the item will be unloaded when it is out of the viewport.
