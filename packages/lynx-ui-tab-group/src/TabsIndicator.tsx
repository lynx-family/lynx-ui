// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import {
  runOnBackground,
  runOnMainThread,
  useEffect,
  useMainThreadRef,
} from '@lynx-js/react'

import { mtsLog } from '@lynx-js/lynx-ui-common'
import { animate, useMotionValueRefEvent } from '@lynx-js/motion/mini'
import { clsx } from 'clsx'

import { useTabsContext, useTabsRootContext } from './TabsContext'
import type { TabsIndicatorProps } from './types'
import {
  getIndicatorStyleProperties,
  shouldAnimateIndicator,
  toMiniAnimationOptions,
} from './utils/tabsIndicatorAnimation'
import { calculateIndicatorPosition } from './utils/tabsIndicatorGeometry'

import './index.css'

export const TabsIndicator = (props: TabsIndicatorProps) => {
  const { style, className, indicatorProps, children } = props
  const {
    style: indicatorPropsStyle,
    className: indicatorPropsClassName,
    ...indicatorPropsWithoutStyle
  } = indicatorProps ?? {}
  const { tabKeyArray } = useTabsContext()
  const {
    panelOffset,
    tabSelectIndex,
    tabsWidthMapMT,
    indicatorOffsetMT,
    indicatorElementMT,
    hasRenderedIndicatorMT,
    hasPanel,
    selectBehavior,
    indicatorAnimation,
    selectTarget,
    onTabChanged,
    debugLog,
    enableRTL,
  } = useTabsRootContext()

  const offsetMotionRef = indicatorOffsetMT
  const tabChangeHandledBySelectTargetMT = useMainThreadRef<number>(-1)

  const updateIndicator = (params: { width: number, left: number }) => {
    'main thread'
    mtsLog(debugLog, '[lynx-ui tabs] update indicator', params)
    indicatorElementMT.current?.setStyleProperties(
      getIndicatorStyleProperties(params.width, params.left, enableRTL),
    )
  }

  const calcFromOffset = (
    offset: number,
  ): { width: number, left: number } | undefined => {
    'main thread'
    return calculateIndicatorPosition(
      offset,
      tabKeyArray,
      tabsWidthMapMT.current.get(),
    )
  }

  const updateIndicatorAtOffset = (offset: number) => {
    'main thread'
    const indicatorPosition = calcFromOffset(offset)
    if (!indicatorPosition) {
      return
    }
    updateIndicator(indicatorPosition)
    hasRenderedIndicatorMT.current = true
  }

  const updateIndicatorPosition = () => {
    'main thread'
    offsetMotionRef.current.stop()
    updateIndicatorAtOffset(offsetMotionRef.current.get())
  }

  useMotionValueRefEvent(offsetMotionRef, 'change', (offset) => {
    'main thread'
    updateIndicatorAtOffset(offset)
  })

  const syncIndicatorOffset = (offset: number) => {
    'main thread'
    offsetMotionRef.current.stop()
    offsetMotionRef.current.jump(offset)
  }

  const animateToTab = (toIndex: number) => {
    'main thread'
    offsetMotionRef.current.stop()
    mtsLog(
      debugLog,
      '[lynx-ui tabs] animateToTab',
      'fromIndex:',
      offsetMotionRef.current.get(),
      'toIndex:',
      toIndex,
    )
    animate(
      offsetMotionRef.current,
      toIndex,
      toMiniAnimationOptions(indicatorAnimation),
    )
  }

  useMotionValueRefEvent(panelOffset, 'change', (offset) => {
    'main thread'
    mtsLog(debugLog, '[lynx-ui tabs] panelOffset', offset, tabKeyArray.length)
    if (offset < 0 || offset > tabKeyArray.length - 1) {
      return
    }
    syncIndicatorOffset(offset)
  })

  useMotionValueRefEvent(tabsWidthMapMT, 'change', () => {
    'main thread'
    updateIndicatorAtOffset(offsetMotionRef.current.get())
  })

  const onTabChangedJS = (index: number) => {
    onTabChanged?.(index)
  }
  useMotionValueRefEvent(
    selectTarget,
    'change',
    (target: { index: number, smooth: boolean }) => {
      'main thread'
      if (target.index < 0 || target.index >= tabKeyArray.length) {
        return
      }
      const { index, smooth } = target
      if (!hasPanel.current.get()) {
        if (hasRenderedIndicatorMT.current && smooth) {
          animateToTab(index)
        } else {
          syncIndicatorOffset(index)
        }
        runOnBackground(onTabChangedJS)(index)
        tabChangeHandledBySelectTargetMT.current = index
      }
    },
  )

  useMotionValueRefEvent(tabSelectIndex, 'change', (index) => {
    'main thread'
    mtsLog(debugLog, '[lynx-ui tabs] tabSelectIndex', index, tabKeyArray.length)
    if (index < 0 || index > tabKeyArray.length - 1) {
      return
    }
    if (!hasPanel.current.get()) {
      if (
        hasRenderedIndicatorMT.current
        && shouldAnimateIndicator(selectBehavior)
      ) {
        animateToTab(index)
      } else {
        syncIndicatorOffset(index)
      }
      if (tabChangeHandledBySelectTargetMT.current === index) {
        tabChangeHandledBySelectTargetMT.current = -1
      } else {
        runOnBackground(onTabChangedJS)(index)
      }
    }
  })

  useEffect(() => {
    runOnMainThread(() => {
      'main thread'
      updateIndicatorPosition()
    })()
  }, [enableRTL])

  return (
    <view
      {...indicatorPropsWithoutStyle}
      main-thread:ref={indicatorElementMT}
      style={indicatorPropsStyle ?? style}
      className={clsx(
        'lynx-ui-tab-group__indicator',
        indicatorPropsClassName,
        className,
      )}
    >
      {children}
    </view>
  )
}
