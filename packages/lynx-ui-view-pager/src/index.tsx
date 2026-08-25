// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import {
  forwardRef,
  memo,
  useImperativeHandle,
  useRef,
  useState,
} from '@lynx-js/react'
import type { ForwardedRef } from '@lynx-js/react'

import { LazyComponent } from '@lynx-js/lynx-ui-lazy-component'
import { clsx } from 'clsx'

import './styles.css'

import type {
  ViewPagerChangeEvent,
  ViewPagerOffsetChangeEvent,
  ViewPagerProps,
  ViewPagerRef,
  ViewPager as ViewPagerType,
} from './types'
import { createViewPagerId, resolveLazyOptions } from './utils'

const mainThreadEventPropMap = {
  MTOnOffsetChange: 'main-thread:bindoffsetchange',
  MTOnPageWillChange: 'main-thread:bindwillchange',
  MTOnPageChange: 'main-thread:bindchange',
} satisfies Partial<Record<keyof ViewPagerProps, string>>

export type {
  ViewPagerOffsetChangeEvent,
  ViewPagerChangeEvent,
  ViewPagerProps,
  ViewPagerRef,
}

export const ViewPager = memo(
  forwardRef(ViewPagerImpl),
) as ViewPagerType

function ViewPagerImpl(props: ViewPagerProps, ref: ForwardedRef<ViewPagerRef>) {
  const {
    style,
    viewpagerItemStyle,
    viewpagerId: viewpagerIdProp,
    bounces = true,
    className,
    viewpagerProps,
    enableScroll = true,
    selectIndexAfterDataSourceChanged = 0,
    // use undefined instead of 0, to resolve the conflict with selectIndexAfterDataSourceChanged
    initialSelectIndex = undefined,
    children,
    lazyOptions,
    scene: legacyScene,
    exposureLeft: legacyExposureLeft,
    exposureRight: legacyExposureRight,
    onPageChange,
    onOffsetChange,
    onPageWillChange,
  } = props
  const [generatedViewPagerId] = useState(createViewPagerId)
  const viewpagerId = viewpagerIdProp ?? generatedViewPagerId
  const initialSelectIndexValue = useRef<number | undefined>(initialSelectIndex)
  const {
    enableLazy,
    scene,
    exposureLeft,
    exposureRight,
  } = resolveLazyOptions(lazyOptions, {
    scene: legacyScene,
    exposureLeft: legacyExposureLeft,
    exposureRight: legacyExposureRight,
  })
  const keepItemView = exposureLeft !== '0px' || exposureRight !== '0px'

  const mainThreadEvents: Record<string, unknown> = {}
  for (const key of Object.keys(mainThreadEventPropMap)) {
    const typedKey = key as keyof typeof mainThreadEventPropMap
    const mappedEventName = mainThreadEventPropMap[typedKey]
    const eventHandler = props[typedKey]
    if (mappedEventName && eventHandler !== undefined) {
      mainThreadEvents[mappedEventName] = eventHandler
    }
  }

  const selectTab = (
    index: number,
    smooth: boolean,
    success?: (res: unknown) => void,
    fail?: (res: unknown) => void,
  ) => {
    lynx
      .createSelectorQuery()
      .select(`#${viewpagerId}`)
      .invoke({
        method: 'selectTab',
        params: {
          index,
          smooth,
        },
        success(res) {
          success?.(res)
        },
        fail(res) {
          fail?.(res)
        },
      })
      .exec()
  }
  useImperativeHandle(
    ref,
    () => ({
      selectTab,
    }),
    [selectTab],
  )
  return (
    <viewpager
      {...(viewpagerProps ?? {})}
      {...mainThreadEvents}
      className={clsx('lynx-ui-view-pager__root', className)}
      id={viewpagerId}
      bindchange={(e) => {
        // Add an event callback to make sure the old version of Lynx Android can trigger the `global-bind` event
        onPageChange?.(e)
      }}
      bindwillchange={onPageWillChange}
      align-width={true}
      bindoffsetchange={onOffsetChange}
      bounces={bounces}
      select-index={initialSelectIndexValue.current
        ?? selectIndexAfterDataSourceChanged}
      initial-select-index={initialSelectIndexValue.current}
      style={{ width: '100%', height: '100%', ...style }}
      keep-item-view={keepItemView}
      allow-horizontal-gesture={enableScroll}
      enable-scroll={enableScroll}
    >
      {children?.map((item, index) => (
        <viewpager-item
          className='lynx-ui-view-pager__item'
          key={item.key ?? index}
          style={viewpagerItemStyle}
        >
          {enableLazy
              && index
                !== (initialSelectIndexValue.current
                  ?? selectIndexAfterDataSourceChanged)
            ? (
              <LazyComponent
                scene={scene}
                estimatedStyle={{ width: '100%', height: '100%' }}
                pid={`pid_${index}`}
                left={exposureLeft}
                right={exposureRight}
              >
                {item}
              </LazyComponent>
            )
            : item}
        </viewpager-item>
      ))}
    </viewpager>
  )
}
