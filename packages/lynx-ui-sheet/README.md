# Sheet

An extension of the Dialog.

## Installation

```bash
npm install @lynx-js/lynx-ui-sheet
```

## Basic Usage

```jsx
import { useState } from '@lynx-js/react'
import { SheetRoot, SheetHandle, SheetContent } from '@lynx-js/lynx-ui-sheet'

function App() {
  const [show, setShow] = useState(false)

  return (
    <view>
      <text bindtap={() => setShow(true)}>Open Sheet</text>
      <SheetRoot show={show} onShowChange={setShow}>
        <SheetContent>
          <SheetHandle />
          <text>Hello World</text>
        </SheetContent>
      </SheetRoot>
    </view>
  )
}
```

## Structure

```jsx
<SheetRoot>
  <SheetView>
    <SheetBackdrop />
    <SheetContent />
  </SheetView>
</SheetRoot>
```

## API

For detailed API reference, please check the source code or generated documentation.
