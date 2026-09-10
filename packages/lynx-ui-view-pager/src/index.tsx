// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import {
  createContext,
  forwardRef,
  isValidElement,
  useContext,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from '@lynx-js/react'
import type { ForwardedRef, ReactElement, ReactNode } from '@lynx-js/react'

import type { NodesRef } from '@lynx-js/types'
import { clsx } from 'clsx'

import './styles.css'

import type {
  ViewPagerItemProps,
  ViewPagerItemRenderProps,
  ViewPagerItemUIVariants,
  ViewPagerProps,
  ViewPagerRef,
} from './types'
import { normalizeIndex } from './utils'

export type * from './types'

const ItemContext = createContext<
  (ViewPagerItemRenderProps & { shouldMount: boolean }) | null
>(null)

// Providers preserve keyed page identity without adding native wrapper nodes.
function collectPages(children: ReactNode): ReactElement[] {
  if (Array.isArray(children)) {
    return children.flatMap((child: ReactNode) => collectPages(child))
  }
  if (children == null || typeof children === 'boolean') return []
  if (!isValidElement(children) || children.type !== ViewPagerItem) {
    throw new Error('ViewPager children must be ViewPagerItem elements.')
  }
  return [children]
}

export const ViewPager = forwardRef(ViewPagerImpl)

function ViewPagerImpl(props: ViewPagerProps, ref: ForwardedRef<ViewPagerRef>) {
  const {
    children,
    initialSelectIndex = 0,
    className,
    style,
    viewpagerProps,
    enableScroll = true,
    bounces = true,
    lazy = true,
    preloadCount = 1,
    onPageChange,
    onPageWillChange,
    onOffsetChange,
    MTOnPageChange,
    MTOnPageWillChange,
    MTOnOffsetChange,
  } = props
  const pages = collectPages(children)
  const initialIndex = useRef(initialSelectIndex)
  const [activeIndex, setActiveIndex] = useState(initialIndex.current)
  const selectedIndex = normalizeIndex(activeIndex, pages.length)
  const nativeRef = useRef<NodesRef>(null)
  const [destination, setDestination] = useState<number | null>(null)

  useImperativeHandle(ref, () => ({
    selectTab(next, smooth, success, fail) {
      if (pages.length === 0) return
      const target = normalizeIndex(next, pages.length)
      setDestination(target)
      nativeRef.current?.invoke({
        method: 'selectTab',
        params: { index: target, smooth: smooth ?? true },
        success,
        fail,
      }).exec()
    },
  }))

  useEffect(() => {
    if (pages.length > 0 && activeIndex !== selectedIndex) {
      setActiveIndex(selectedIndex)
    }
  }, [activeIndex, selectedIndex, pages.length])

  const preload = Number.isFinite(preloadCount)
    ? Math.max(0, Math.trunc(preloadCount))
    : 1

  return (
    <viewpager
      {...viewpagerProps}
      ref={nativeRef}
      className={clsx('lynx-ui-view-pager__root', className)}
      style={style}
      initial-select-index={normalizeIndex(initialIndex.current, pages.length)}
      select-index={selectedIndex}
      align-width={true}
      enable-scroll={enableScroll}
      allow-horizontal-gesture={enableScroll}
      bounces={bounces}
      bindchange={(event) => {
        setActiveIndex(normalizeIndex(event.detail.index, pages.length))
        setDestination(null)
        onPageChange?.(event)
      }}
      bindwillchange={(event) => {
        setDestination(normalizeIndex(event.detail.index, pages.length))
        onPageWillChange?.(event)
      }}
      bindoffsetchange={onOffsetChange}
      main-thread:bindchange={MTOnPageChange}
      main-thread:bindwillchange={MTOnPageWillChange}
      main-thread:bindoffsetchange={MTOnOffsetChange}
    >
      {pages.map((page, pageIndex) => (
        <ItemContext.Provider
          key={page.key ?? pageIndex}
          value={{
            index: pageIndex,
            selected: pageIndex === selectedIndex,
            shouldMount: !lazy
              || Math.abs(pageIndex - selectedIndex) <= preload
              || pageIndex === destination,
          }}
        >
          {page}
        </ItemContext.Provider>
      ))}
    </viewpager>
  )
}

export function ViewPagerItem(props: ViewPagerItemProps): ReactElement {
  const context = useContext(ItemContext)
  if (!context) throw new Error('ViewPagerItem must be inside ViewPager.')
  const { index, selected, shouldMount } = context
  const [mounted, setMounted] = useState(shouldMount)
  useEffect(() => {
    if (shouldMount) setMounted(true)
  }, [shouldMount])
  const variants: ViewPagerItemUIVariants = { 'ui-selected': selected }
  const { children, className, style, itemProps } = props

  let content: ReactNode = null
  if (mounted || shouldMount) {
    content = typeof children === 'function'
      ? children({ index, selected })
      : children
  }

  return (
    <viewpager-item
      {...itemProps}
      className={clsx('lynx-ui-view-pager__item', variants, className)}
      style={style}
    >
      {content}
    </viewpager-item>
  )
}
