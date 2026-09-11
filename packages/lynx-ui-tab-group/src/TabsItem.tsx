// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import {
  runOnMainThread,
  useEffect,
  useMainThreadRef,
  useMemo,
} from '@lynx-js/react'

import { mtsLog } from '@lynx-js/lynx-ui-common'
import { useMotionValueRefEvent } from '@lynx-js/motion/mini'
import type { LayoutChangeDetailEvent, MainThread } from '@lynx-js/types'

import { useTabsContext, useTabsRootContext } from './TabsContext'
import type { TabItemProps } from './types'
import { getIndicatorStyleProperties } from './utils/tabsIndicatorAnimation'
import { calculateIndicatorPosition } from './utils/tabsIndicatorGeometry'

let nextTabRegistrationId = 0

export const TabsItem = (props: TabItemProps) => {
  const { style, className, tabKey, children, ...viewProps } = props
  const { selectTab, tabKeyArray } = useTabsContext()
  const {
    tabsWidthMapMT,
    tabRegistrationMapMT,
    indicatorOffsetMT,
    indicatorElementMT,
    hasRenderedIndicatorMT,
    isFirstScreenSyncMT,
    onClickItem,
    selectTarget,
    debugLog,
    enableRTL,
    selectBehavior,
  } = useTabsRootContext()
  const MTSViewRef = useMainThreadRef<MainThread.Element>(null)
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

  const scrollToCenterAfterInitialAlignmentMT = (smooth: boolean) => {
    'main thread'
    const shouldSmooth = !isFirstScreenSyncMT.current && smooth
    scrollToCenterMT(shouldSmooth)
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
        scrollToCenterAfterInitialAlignmentMT(target.smooth)
      }
    },
  )

  const updateIndicatorPositionMT = () => {
    'main thread'
    const indicatorPosition = calculateIndicatorPosition(
      indicatorOffsetMT.current.get(),
      tabKeyArray,
      tabsWidthMapMT.current.get(),
    )
    if (!indicatorPosition) {
      return
    }

    indicatorElementMT.current?.setStyleProperties(
      getIndicatorStyleProperties(
        indicatorPosition.width,
        indicatorPosition.left,
        enableRTL,
      ),
    )
    hasRenderedIndicatorMT.current = true
  }
  const registerTabWidthMT = (width: number) => {
    'main thread'
    mtsLog(debugLog, '[lynx-ui tabs] registerTabWidthMT', tabKey, width)
    tabsWidthMapMT.current.set({
      ...tabsWidthMapMT.current.get(),
      [tabKey]: width,
    })
    tabRegistrationMapMT.current[tabKey] = tabRegistrationId
    updateIndicatorPositionMT()
  }
  const unregisterTabWidthMT = (key: string, registrationId: number) => {
    'main thread'
    if (tabRegistrationMapMT.current[key] !== registrationId) {
      return
    }
    mtsLog(debugLog, '[lynx-ui tabs] unregisterTabWidthMT', key)
    const nextValue = { ...tabsWidthMapMT.current.get() }
    delete nextValue[key]
    tabsWidthMapMT.current.set(nextValue)
    delete tabRegistrationMapMT.current[key]
  }

  const onLayoutChange = (e: LayoutChangeDetailEvent<MainThread.Element>) => {
    'main thread'
    // Android reports main-thread layout data through `params`, while iOS
    // reports it through `detail`.
    const width = e.detail?.width ?? e.params?.width
    if (typeof width !== 'number') {
      return
    }
    registerTabWidthMT(width)
  }

  useEffect(() => {
    return () => {
      runOnMainThread(unregisterTabWidthMT)(tabKey, tabRegistrationId)
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
