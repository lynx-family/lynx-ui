// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { root, useRef } from '@lynx-js/react'

import {
  SheetBackdrop,
  SheetContent,
  SheetRoot,
  SheetView,
} from '@lynx-js/lynx-ui'
import type { SheetRootRef } from '@lynx-js/lynx-ui'

import { ActionButton, TriggerButton } from '../shared/index.js'

import './index.css'

function DrawerSection(
  props: {
    title: string
    description: string
    note: string
    close: () => void
    contentClassName: string
  },
) {
  const { title, description, note, close, contentClassName } = props

  return (
    <SheetContent
      className={contentClassName}
      innerClassName='drawer-inner-content'
    >
      <view className='drawer-panel'>
        <text className='header-text'>{title}</text>
        <text className='info-text'>{description}</text>
        <text className='info-text'>{note}</text>
        <ActionButton onClick={close} text='Close Drawer' />
      </view>
    </SheetContent>
  )
}

function App() {
  const leftDrawerRef = useRef<SheetRootRef>(null)
  const rightDrawerRef = useRef<SheetRootRef>(null)

  return (
    <view className='demo-container lunaris-dark'>
      <text className='title-text'>Directional Sheet</text>
      <text className='subtitle-text'>
        Left uses fit width, right uses a width-based percentage snap point.
      </text>
      <view className='button-group'>
        <TriggerButton
          onClick={() => leftDrawerRef.current?.open()}
          text='Open Left Drawer'
        />
        <TriggerButton
          onClick={() => rightDrawerRef.current?.open()}
          text='Open Right Drawer'
        />
      </view>

      <SheetRoot
        ref={leftDrawerRef}
        direction='left'
        snapPoints={['fit']}
        initialSnap={0}
      >
        <SheetView className='sheet-viewport'>
          <SheetBackdrop className='sheet-overlay' clickToClose={true} />
          <DrawerSection
            title='Left Drawer'
            description='This drawer uses direction="left" with snapPoints=["fit"].'
            note='The drawer width comes from the surface class so fit resolves from the measured width.'
            close={() => leftDrawerRef.current?.close()}
            contentClassName='drawer-content drawer-content-fit'
          />
        </SheetView>
      </SheetRoot>

      <SheetRoot
        ref={rightDrawerRef}
        direction='right'
        snapPoints={['72%']}
        initialSnap={0}
      >
        <SheetView className='sheet-viewport'>
          <SheetBackdrop className='sheet-overlay' clickToClose={true} />
          <DrawerSection
            title='Right Drawer'
            description='This drawer uses direction="right" with a percentage snap point.'
            note='The 72% snap point resolves against viewport width instead of viewport height.'
            close={() => rightDrawerRef.current?.close()}
            contentClassName='drawer-content drawer-content-percent'
          />
        </SheetView>
      </SheetRoot>
    </view>
  )
}

root.render(<App />)

export default App
