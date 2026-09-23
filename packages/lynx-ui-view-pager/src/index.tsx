// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { forwardRef, memo, useImperativeHandle, useRef } from '@lynx-js/react'
import type { ForwardedRef, ReactElement, ReactNode } from '@lynx-js/react'

import { LazyComponent } from '@lynx-js/lynx-ui-lazy-component'
import type { NodesRef } from '@lynx-js/types'
import { clsx } from 'clsx'

import './styles.css'

import type {
  ViewPagerLazyOptions,
  ViewPagerProps,
  ViewPagerRef,
} from './types'
import { normalizeIndex } from './utils'

export type * from './types'

type ViewPagerComponent = <T>(
  props: ViewPagerProps<T> & { ref?: ForwardedRef<ViewPagerRef> },
) => ReactElement

interface PageContentProps {
  item: unknown
  index: number
  renderItem: (item: unknown, index: number) => ReactNode
}

const PageContent = memo(function PageContent(props: PageContentProps) {
  return props.renderItem(props.item, props.index)
})

interface PageItemProps extends PageContentProps {
  itemKey: string | number
  initial: boolean
  className?: string
  style?: ViewPagerProps<unknown>['itemStyle']
  lazyOptions?: ViewPagerLazyOptions
}

function PageItem(props: PageItemProps) {
  const {
    item,
    index,
    itemKey,
    initial,
    renderItem,
    className,
    style,
    lazyOptions,
  } = props
  const content = (
    <PageContent item={item} index={index} renderItem={renderItem} />
  )

  return (
    <viewpager-item
      className={clsx(
        'lynx-ui-view-pager__item',
        className,
      )}
      style={style}
    >
      {lazyOptions?.enableLazy && !initial
        ? (
          <LazyComponent
            pid={`lynx-ui-view-pager-${String(itemKey)}`}
            scene={lazyOptions.scene}
            estimatedStyle={{ width: '100%', height: '100%' }}
            left={lazyOptions.exposureLeft}
            right={lazyOptions.exposureRight}
          >
            {content}
          </LazyComponent>
        )
        : content}
    </viewpager-item>
  )
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

  return (
    <viewpager
      {...viewpagerProps}
      ref={nativeRef}
      id={id}
      className={clsx('lynx-ui-view-pager__root', className)}
      style={style}
      initial-select-index={normalizedInitialIndex}
      align-width={true}
      enable-scroll={enableScroll}
      allow-horizontal-gesture={enableScroll}
      bounces={bounces}
      keep-item-view={keepItemView}
      bindchange={onPageChange}
      bindwillchange={onPageWillChange}
      bindoffsetchange={onOffsetChange}
      main-thread:bindchange={onPageChangeMT}
      main-thread:bindwillchange={onPageWillChangeMT}
      main-thread:bindoffsetchange={onOffsetChangeMT}
    >
      {data.map((item, index) => {
        const itemKey = getItemKey?.(item, index) ?? index
        return (
          <PageItem
            key={itemKey}
            item={item}
            index={index}
            itemKey={itemKey}
            initial={index === normalizedInitialIndex}
            renderItem={renderItem}
            className={itemClassName}
            style={itemStyle}
            lazyOptions={lazyOptions}
          />
        )
      })}
    </viewpager>
  )
}
