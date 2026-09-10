// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { createContext, useContext } from '@lynx-js/react'
import type { MainThreadRef } from '@lynx-js/react'

import type { MotionValue } from '@lynx-js/motion/mini'

import type { TabsIndicatorAnimation } from './types'

type MotionValueRef<T> = MainThreadRef<MotionValue<T>>

interface TabsRootContextValue {
  debugLog: boolean
  enableRTL: boolean
  selectBehavior?: 'smooth' | 'instant'
  indicatorAnimation?: TabsIndicatorAnimation
  initialSelectIndex: number

  hasPanelMT: MotionValueRef<boolean>
  panelIndexMT: MotionValueRef<number>
  tabsWidthMapMT: MotionValueRef<Record<string, number>>
  tabRegistrationMapMT: MainThreadRef<Record<string, number>>
  indicatorOffsetMT: MotionValueRef<number>
  selectTarget: MotionValueRef<{ index: number, smooth: boolean }>
  selectTabByIndex: (index: number) => void
  unregisterTabWidth: (tabKey: string, registrationId: number) => void

  onClickItem?: (index: number) => void
  onTabChanged?: (index: number) => void
}

export const TabsRootContext = createContext<TabsRootContextValue | null>(null)

export function useTabsRootContext() {
  const context = useContext(TabsRootContext)
  if (!context) {
    throw new Error('useTabsRootContext must be used within a TabsRoot')
  }
  return context
}

interface TabsContextValue {
  selectTab: (tabKey: string) => void
  tabKeyArray: string[]
}

export const TabsContext = createContext<TabsContextValue | null>(null)

export function useTabsContext() {
  const context = useContext(TabsContext)
  if (!context) {
    throw new Error('useTabsContext must be used within a TabsBar')
  }
  return context
}
