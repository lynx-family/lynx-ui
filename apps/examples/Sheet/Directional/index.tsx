// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { root, useRef } from '@lynx-js/react'

import {
  SheetBackdrop,
  SheetContent,
  SheetHandle,
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
    surfaceClassName: string
    innerClassName: string
  },
) {
  const {
    title,
    description,
    note,
    close,
    surfaceClassName,
    innerClassName,
  } = props

  return (
    <SheetContent
      className={surfaceClassName}
      innerClassName={innerClassName}
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
  const startDrawerRef = useRef<SheetRootRef>(null)
  const endDrawerRef = useRef<SheetRootRef>(null)
  const topSheetRef = useRef<SheetRootRef>(null)
  const bottomSheetRef = useRef<SheetRootRef>(null)

  return (
    <view className='demo-container lunaris-dark'>
      <text className='title-text'>Directional Sheet</text>
      <text className='subtitle-text'>
        Left and right are physical sides. Start and end are logical sides that
        can flip with enableRTL.
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
        <TriggerButton
          onClick={() => startDrawerRef.current?.open()}
          text='Open Start Drawer'
        />
        <TriggerButton
          onClick={() => endDrawerRef.current?.open()}
          text='Open End Drawer'
        />
        <TriggerButton
          onClick={() => topSheetRef.current?.open()}
          text='Open Top Sheet'
        />
        <TriggerButton
          onClick={() => bottomSheetRef.current?.open()}
          text='Open Bottom Sheet'
        />
      </view>

      <SheetRoot
        ref={leftDrawerRef}
        side='left'
        snapPoints={['fit']}
        initialSnap={0}
      >
        <SheetView className='sheet-viewport'>
          <SheetBackdrop className='sheet-overlay' clickToClose={true} />
          <DrawerSection
            title='Left Drawer'
            description='This drawer uses side="left" with snapPoints=["fit"].'
            note='Use physical sides when the panel should stay on that edge in both LTR and RTL.'
            close={() => leftDrawerRef.current?.close()}
            surfaceClassName='drawer-content drawer-content-left'
            innerClassName='drawer-inner-content drawer-inner-content-fit'
          />
        </SheetView>
      </SheetRoot>

      <SheetRoot
        ref={rightDrawerRef}
        side='right'
        snapPoints={['72%']}
        initialSnap={0}
        rubberBand={true}
      >
        <SheetView className='sheet-viewport'>
          <SheetBackdrop className='sheet-overlay' clickToClose={true} />
          <DrawerSection
            title='Right Drawer'
            description='This drawer uses side="right" with a percentage snap point.'
            note='The 72% snap point resolves against viewport width instead of viewport height.'
            close={() => rightDrawerRef.current?.close()}
            surfaceClassName='drawer-content drawer-content-right'
            innerClassName='drawer-inner-content drawer-inner-content-percent'
          />
        </SheetView>
      </SheetRoot>

      <SheetRoot
        ref={startDrawerRef}
        side='start'
        enableRTL={true}
        snapPoints={['fit']}
        initialSnap={0}
      >
        <SheetView className='sheet-viewport'>
          <SheetBackdrop className='sheet-overlay' clickToClose={true} />
          <DrawerSection
            title='Start Drawer'
            description='This drawer uses side="start" with snapPoints=["fit"].'
            note='This example sets enableRTL, so start resolves to right. Disable it to make start resolve to left.'
            close={() => startDrawerRef.current?.close()}
            surfaceClassName='drawer-content drawer-content-right'
            innerClassName='drawer-inner-content drawer-inner-content-fit'
          />
        </SheetView>
      </SheetRoot>

      <SheetRoot
        ref={endDrawerRef}
        side='end'
        snapPoints={['72%']}
        initialSnap={0}
      >
        <SheetView className='sheet-viewport'>
          <SheetBackdrop className='sheet-overlay' clickToClose={true} />
          <DrawerSection
            title='End Drawer'
            description='This drawer uses side="end" with a percentage snap point.'
            note='Without enableRTL, end resolves to right. Turn enableRTL on to make end resolve to left.'
            close={() => endDrawerRef.current?.close()}
            surfaceClassName='drawer-content drawer-content-right'
            innerClassName='drawer-inner-content drawer-inner-content-percent'
          />
        </SheetView>
      </SheetRoot>

      <SheetRoot
        ref={topSheetRef}
        side='top'
        snapPoints={['fit']}
        initialSnap={0}
      >
        <SheetView className='sheet-viewport'>
          <SheetBackdrop className='sheet-overlay' clickToClose={true} />
          <SheetContent
            className='top-sheet-shell'
            innerClassName='top-sheet-content'
          >
            <view className='top-sheet-panel'>
              <text className='header-text'>Top Sheet</text>
              <text className='info-text'>
                This sheet uses side="top". Its fit snap point resolves from
                measured height.
              </text>
              <ActionButton
                onClick={() => topSheetRef.current?.close()}
                text='Close Top Sheet'
              />
            </view>
          </SheetContent>
        </SheetView>
      </SheetRoot>

      <SheetRoot
        ref={bottomSheetRef}
        side='bottom'
        snapPoints={['fit']}
        initialSnap={0}
      >
        <SheetView className='sheet-viewport'>
          <SheetBackdrop className='sheet-overlay' clickToClose={true} />
          <SheetContent
            className='bottom-sheet-shell'
            innerClassName='bottom-sheet-content'
          >
            <SheetHandle className='bottom-sheet-handle' />
            <view className='bottom-sheet-panel'>
              <text className='header-text'>Bottom Sheet</text>
              <text className='info-text'>
                This sheet uses the default bottom side. Its fit snap point
                resolves from measured height.
              </text>
              <ActionButton
                onClick={() => bottomSheetRef.current?.close()}
                text='Close Bottom Sheet'
              />
            </view>
          </SheetContent>
        </SheetView>
      </SheetRoot>
    </view>
  )
}

root.render(<App />)

export default App
