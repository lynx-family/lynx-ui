// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import {
  runOnMainThread,
  useEffect,
  useMainThreadRef,
  useMemo,
} from '@lynx-js/react'

import { useMotionValueRefEvent } from '@lynx-js/motion/mini'
import type { LayoutChangeDetailEvent, MainThread } from '@lynx-js/types'

import { useTabsContext, useTabsRootContext } from './TabsContext'
import type { TabItemProps } from './types'

let nextTabRegistrationId = 0

export const TabsItem = (props: TabItemProps) => {
  const { style, className, tabKey, children, ...viewProps } = props
  const { selectTab, tabKeyArray } = useTabsContext()
  const {
    tabsWidthMapMT,
    tabRegistrationMapMT,
    onClickItem,
    initialSelectIndex,
    panelIndexMT,
    selectTarget,
    selectBehavior,
    unregisterTabWidth,
  } = useTabsRootContext()
  const MTSViewRef = useMainThreadRef<MainThread.Element>(null)
  const hasAlignedInitialSelectionMT = useMainThreadRef<boolean>(false)
  const tabRegistrationId = useMemo(() => nextTabRegistrationId++, [tabKey])

  const scrollToCenterMT = (smooth = true) => {
    'main thread'
    MTSViewRef.current?.invoke('scrollIntoView', {
      scrollIntoViewOptions: {
        block: 'center',
        inline: 'center',
        ...(smooth ? { behavior: 'smooth' } : {}),
      },
    })
  }

  const onClick = () => {
    runOnMainThread(scrollToCenterMT)(selectBehavior !== 'instant')
    selectTab(tabKey)
    onClickItem?.(tabKeyArray.indexOf(tabKey))
  }

  useMotionValueRefEvent(
    selectTarget,
    'change',
    (target: { index: number, smooth: boolean }) => {
      'main thread'
      if (tabKey === tabKeyArray[target.index]) {
        scrollToCenterMT(target.smooth)
      }
    },
  )

  useMotionValueRefEvent(panelIndexMT, 'change', (index) => {
    'main thread'
    if (tabKey === tabKeyArray[index]) {
      scrollToCenterMT(true)
    }
  })

  const onLayoutChange = (
    event: LayoutChangeDetailEvent<MainThread.Element>,
  ) => {
    'main thread'
    const width = event.detail?.width ?? event.params?.width
    if (typeof width !== 'number') {
      return
    }
    tabsWidthMapMT.current.set({
      ...tabsWidthMapMT.current.get(),
      [tabKey]: width,
    })
    tabRegistrationMapMT.current[tabKey] = tabRegistrationId
    if (
      !hasAlignedInitialSelectionMT.current
      && tabKey === tabKeyArray[initialSelectIndex]
    ) {
      MTSViewRef.current?.invoke('scrollIntoView', {
        scrollIntoViewOptions: {
          block: 'center',
          inline: 'center',
        },
      })
      hasAlignedInitialSelectionMT.current = true
    }
  }

  useEffect(() => {
    return () => {
      unregisterTabWidth(tabKey, tabRegistrationId)
    }
  }, [tabKey, tabRegistrationId])

  return (
    <view
      {...viewProps}
      main-thread:ref={MTSViewRef}
      bindtap={onClick}
      className={className}
      style={style}
      main-thread:bindlayoutchange={onLayoutChange}
    >
      {children}
    </view>
  )
}
