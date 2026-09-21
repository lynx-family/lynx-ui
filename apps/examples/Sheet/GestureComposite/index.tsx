// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useRef } from '@lynx-js/react'

import {
  SheetBackdrop,
  SheetGestureContent,
  SheetHandle,
  SheetRoot,
  SheetView,
  useSheetScrollGesture,
} from '@lynx-js/lynx-ui'
import type { SheetRootRef } from '@lynx-js/lynx-ui'

import { TriggerButton } from '../shared/index.js'
import './index.css'

const categories = ['Overview', 'Activity', 'Insights', 'Settings']

function HorizontalCategories() {
  return (
    <scroll-view
      className='category-strip'
      scroll-orientation='horizontal'
      bounces={false}
    >
      <view className='category-row'>
        {categories.map((category) => (
          <view className='category-card' key={category}>
            <text className='category-text'>{category}</text>
          </view>
        ))}
      </view>
    </scroll-view>
  )
}

function FoldLikeContent() {
  const verticalGesture = useSheetScrollGesture()

  return (
    <scroll-view
      className='fold-like-content'
      scroll-orientation='vertical'
      bounces={false}
      main-thread:gesture={verticalGesture}
    >
      <view className='fold-toolbar'>
        <text className='fold-toolbar-title'>Primary vertical owner</text>
        <text className='fold-toolbar-copy'>
          A real FoldView binds the returned gesture at this same level.
        </text>
      </view>
      <HorizontalCategories />
      {Array.from(
        { length: 16 },
        (_, index) => (
          <view className='feed-row' key={index}>
            <text className='feed-title'>{`Feed row ${index + 1}`}</text>
            <text className='feed-copy'>
              Vertical content remains the owner.
            </text>
          </view>
        ),
      )}
    </scroll-view>
  )
}

function App() {
  const sheetRef = useRef<SheetRootRef>(null)

  return (
    <view className='demo-container lunaris-dark'>
      <text className='title-text'>Gesture Sheet + Composed Content</text>
      <text className='subtitle-text'>
        Handle drag, vertical handoff, and horizontal scrolling stay separate.
      </text>
      <TriggerButton
        onClick={() => sheetRef.current?.open()}
        text='Open composed Sheet'
      />

      <SheetRoot ref={sheetRef} snapPoints={['45%', '90%']} initialSnap={0}>
        <SheetView className='sheet-viewport'>
          <SheetBackdrop className='sheet-overlay' />
          <SheetGestureContent
            className='sheet-content'
            innerClassName='composite-layout'
          >
            <SheetHandle className='composite-handle'>
              <view className='sheet-handle' />
              <text className='handle-label'>Drag handle</text>
            </SheetHandle>
            <FoldLikeContent />
          </SheetGestureContent>
        </SheetView>
      </SheetRoot>
    </view>
  )
}

root.render(<App />)
export default App
