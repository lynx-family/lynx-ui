// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { runOnMainThread, useEffect, useMainThreadRef } from '@lynx-js/react'

import { mtsLog } from '@lynx-js/lynx-ui-common'
import { animate, useMotionValueRefEvent } from '@lynx-js/motion/mini'
import type { CSSProperties, MainThread } from '@lynx-js/types'
import { clsx } from 'clsx'

import { useTabsContext, useTabsRootContext } from './TabsContext'
import type { TabsIndicatorProps } from './types'
import {
  getIndicatorStyleProperties,
  toMiniAnimationOptions,
} from './utils/tabsIndicatorAnimation'
import { calculateIndicatorPosition } from './utils/tabsIndicatorGeometry'

import './styles.css'

export const TabsIndicator = (props: TabsIndicatorProps) => {
  const { id, style, className, indicatorProps, children } = props
  const {
    style: indicatorPropsStyle,
    className: indicatorPropsClassName,
    ...indicatorPropsWithoutStyle
  } = indicatorProps ?? {}
  const customStyle = indicatorPropsStyle ?? style
  const { tabKeyArray } = useTabsContext()
  const {
    hasPanelMT,
    tabsWidthMapMT,
    indicatorOffsetMT,
    indicatorAnimation,
    selectTarget,
    debugLog,
    enableRTL,
  } = useTabsRootContext()

  const offsetMotionRef = indicatorOffsetMT
  const indicatorElementMT = useMainThreadRef<MainThread.Element | null>(null)
  const hasRenderedIndicatorMT = useMainThreadRef<boolean>(false)

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

  useMotionValueRefEvent(tabsWidthMapMT, 'change', () => {
    'main thread'
    updateIndicatorAtOffset(offsetMotionRef.current.get())
  })

  useMotionValueRefEvent(
    selectTarget,
    'change',
    (target: { index: number, smooth: boolean }) => {
      'main thread'
      if (target.index < 0 || target.index >= tabKeyArray.length) {
        return
      }
      const { index, smooth } = target
      if (hasPanelMT.current.get()) {
        return
      }
      if (hasRenderedIndicatorMT.current && smooth) {
        animateToTab(index)
      } else {
        syncIndicatorOffset(index)
      }
    },
  )

  useEffect(() => {
    runOnMainThread(() => {
      'main thread'
      updateIndicatorPosition()
    })()
  }, [enableRTL])

  const initialDynamicStyle: CSSProperties = enableRTL
    ? { width: '0px', right: '0px' }
    : { width: '0px', left: '0px' }
  const indicatorStyle = typeof customStyle === 'string'
    ? `${
      enableRTL ? 'width:0px;right:0px;' : 'width:0px;left:0px;'
    }${customStyle}`
    : { ...initialDynamicStyle, ...customStyle }

  return (
    <view
      {...indicatorPropsWithoutStyle}
      id={id}
      main-thread:ref={indicatorElementMT}
      style={indicatorStyle}
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
