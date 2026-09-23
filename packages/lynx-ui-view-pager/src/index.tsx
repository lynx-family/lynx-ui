// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { forwardRef, memo, useImperativeHandle, useRef } from '@lynx-js/react'
import type { ForwardedRef, ReactElement, ReactNode } from '@lynx-js/react'

import { LazyComponent } from '@lynx-js/lynx-ui-lazy-component'
import type { NodesRef } from '@lynx-js/types'
import { clsx } from 'clsx'

import type { ViewPagerProps, ViewPagerRef } from './types'
import { normalizeIndex } from './utils'

export type * from './types'

type ViewPagerComponent = <T>(
  props: ViewPagerProps<T> & { ref?: ForwardedRef<ViewPagerRef> },
) => ReactElement

interface DeferredPageContentProps {
  item: unknown
  index: number
  renderItem: (item: unknown, index: number) => ReactNode
}

function DeferredPageContent(props: DeferredPageContentProps) {
  return props.renderItem(props.item, props.index)
}

export const ViewPager = memo(forwardRef(ViewPagerImpl)) as ViewPagerComponent

function ViewPagerImpl<T>(
  props: ViewPagerProps<T>,
  ref: ForwardedRef<ViewPagerRef>,
) {
  const {
    data,
    getItemKey,
    children,
    initialSelectIndex = 0,
    id,
    className,
    style,
    itemClassName,
    itemStyle,
    getItemProps,
    viewpagerProps,
    enableScroll = true,
    bounces = true,
    lazyOptions,
    onPageChange,
    onPageWillChange,
    onOffsetChange,
    'main-thread:onPageChange': onPageChangeMT,
    'main-thread:onPageWillChange': onPageWillChangeMT,
    'main-thread:onOffsetChange': onOffsetChangeMT,
  } = props
  const initialIndex = useRef(initialSelectIndex)
  const nativeRef = useRef<NodesRef>(null)
  const countRef = useRef(data.length)
  countRef.current = data.length
  const normalizedInitialIndex = normalizeIndex(
    initialIndex.current,
    data.length,
  )
  const initialItemKey = useRef<string | number | undefined>(undefined)
  if (initialItemKey.current === undefined && data.length > 0) {
    initialItemKey.current = getItemKey?.(
      data[normalizedInitialIndex],
      normalizedInitialIndex,
    ) ?? normalizedInitialIndex
  }

  useImperativeHandle(ref, () => ({
    scrollToPage(next, smooth, success, fail) {
      if (countRef.current === 0) return
      nativeRef.current?.invoke({
        method: 'selectTab',
        params: {
          index: normalizeIndex(next, countRef.current),
          smooth: smooth ?? true,
        },
        success,
        fail,
      }).exec()
    },
  }))

  const renderItem = children as (item: unknown, index: number) => ReactNode
  const keepItemView = lazyOptions?.enableLazy === true
  // Lynx can invoke an undefined native event binding during a swipe.
  const eventProps = {
    ...(onPageChange && { bindchange: onPageChange }),
    ...(onPageWillChange && { bindwillchange: onPageWillChange }),
    ...(onOffsetChange && { bindoffsetchange: onOffsetChange }),
    ...(onPageChangeMT && { 'main-thread:bindchange': onPageChangeMT }),
    ...(onPageWillChangeMT && {
      'main-thread:bindwillchange': onPageWillChangeMT,
    }),
    ...(onOffsetChangeMT && {
      'main-thread:bindoffsetchange': onOffsetChangeMT,
    }),
  }

  return (
    <viewpager
      {...viewpagerProps}
      ref={nativeRef}
      id={id}
      className={className}
      style={{ width: '100%', display: 'flex', flexDirection: 'row', ...style }}
      initial-select-index={normalizedInitialIndex}
      align-width={true}
      enable-scroll={enableScroll}
      allow-horizontal-gesture={enableScroll}
      bounces={bounces}
      keep-item-view={keepItemView}
      {...eventProps}
    >
      {data.map((item, index) => {
        const itemKey = getItemKey?.(item, index) ?? index
        const perItemProps = getItemProps?.(item, index)
        return (
          <viewpager-item
            {...perItemProps}
            key={itemKey}
            className={clsx(itemClassName, perItemProps?.className)}
            style={{
              display: 'flex',
              width: '100%',
              flexShrink: 0,
              ...itemStyle,
              ...perItemProps?.style,
            }}
          >
            {lazyOptions?.enableLazy && itemKey !== initialItemKey.current
              ? (
                <LazyComponent
                  pid={`lynx-ui-view-pager-${String(itemKey)}`}
                  scene={lazyOptions.scene}
                  estimatedStyle={{ width: '100%', height: '100%' }}
                  left={lazyOptions.exposureLeft}
                  right={lazyOptions.exposureRight}
                >
                  <DeferredPageContent
                    item={item}
                    index={index}
                    renderItem={renderItem}
                  />
                </LazyComponent>
              )
              : renderItem(item, index)}
          </viewpager-item>
        )
      })}
    </viewpager>
  )
}
