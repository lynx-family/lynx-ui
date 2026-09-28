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

import { getRectById, getRectByRef } from '@lynx-js/lynx-ui-common'
import type {
  LayoutChangeEvent,
  NodesRef,
  RefreshHeaderOffsetEvent,
  RefreshStartRefreshEvent,
  RefreshStateChangeEvent,
  ScrollCoordinatorOffsetEvent,
} from '@lynx-js/types'
import { clsx } from 'clsx'

import type { ScrollCoordinatorProps, ScrollCoordinatorRef } from './types'
import './styles.css'

// cspell:ignore bindoffset bindstartrefresh bindheaderoffset bindheaderreleased bindrefreshstatechange scrollchild

export type * from './types'

export const ScrollCoordinator = memo(forwardRef(ScrollCoordinatorImpl))

function ScrollCoordinatorImpl(
  props: ScrollCoordinatorProps,
  ref: ForwardedRef<ScrollCoordinatorRef>,
) {
  const {
    id,
    className,
    style,
    coordinatorProps,
    headers,
    toolbar,
    slot,
    refreshOptions = false,
    bounces = false,
    enableScroll = true,
    refreshInSlot = false,
    scrollBarEnable = false,
    headerOverSlot = false,
    experimentalOverflowHitTestFallback = false,
    granularity = 0.01,
    popupOptions,
    scrollWithNative = false,
    onOffsetChange,
    'main-thread:onOffsetChange': onOffsetChangeMT,
    'main-thread:gesture': gesture,
    onSticky,
    onLeaveSticky,
  } = props
  const nativeRef = useRef<NodesRef>(null)
  const headerRef = useRef<NodesRef>(null)
  const refreshRef = useRef<NodesRef>(null)
  const refreshHeaderSize = useRef(0)
  const refreshOffset = useRef(0)
  const stickyRef = useRef(false)
  const [isSticky, setSticky] = useState(false)
  const refreshProps = refreshOptions || undefined
  const hasRefresh = refreshProps !== undefined
  const enableRefresh = refreshProps?.enableRefresh ?? false

  const scrollTo: ScrollCoordinatorRef['scrollTo'] = (
    offset,
    animated,
    success,
    fail,
  ) => {
    nativeRef.current?.invoke({
      method: 'setFoldExpanded',
      params: { offset, smooth: animated },
      success,
      fail,
    }).exec()
  }

  useImperativeHandle(ref, () => ({
    startRefresh() {
      if (!enableRefresh) return
      refreshRef.current?.invoke({ method: 'autoStartRefresh' }).exec()
    },
    finishRefresh() {
      refreshRef.current?.invoke({ method: 'finishRefresh' }).exec()
    },
    scrollTo,
    scrollToTop(animated, success, fail) {
      scrollTo('0px', animated, success, fail)
    },
    scrollToSticky(animated, success, fail) {
      // The native method clamps the requested offset to the header's range.
      scrollTo('99999999px', animated, success, fail)
    },
    scrollIntoView(targetId, animated, success, fail) {
      Promise.all([getRectById(targetId), getRectByRef(headerRef)])
        .then(([target, header]) =>
          scrollTo(`${target.top - header.top}px`, animated, success, fail)
        )
        .catch((error: unknown) => fail?.(error))
    },
  }))

  const bindOffset = (event: ScrollCoordinatorOffsetEvent) => {
    const { offset, height } = event.detail
    onOffsetChange?.({ offset, height })
    const sticky = height > 0 && offset / height >= 1 - granularity
    if (sticky === stickyRef.current) return
    // Native events can arrive before React commits the next render.
    stickyRef.current = sticky
    setSticky(sticky)
    if (sticky) onSticky?.()
    else onLeaveSticky?.()
  }

  const handleOffsetMT = (event: ScrollCoordinatorOffsetEvent) => {
    'main thread'
    const { offset, height } = event.detail
    onOffsetChangeMT?.({ offset, height })
  }

  const handleRefreshHeaderLayout = (event: LayoutChangeEvent) => {
    refreshHeaderSize.current = event.detail.height
  }

  const handleRefreshOffset = (event: RefreshHeaderOffsetEvent) => {
    const headerSize = refreshHeaderSize.current
    const offset = event.detail.offsetPercent * headerSize
    refreshOffset.current = offset
    refreshProps?.onRefreshOffsetChange?.({
      offset,
      headerSize,
      isDragging: event.detail.isDragging,
    })
  }

  const handleStartRefresh = (event: RefreshStartRefreshEvent) => {
    if (!enableRefresh) return
    refreshProps?.onStartRefresh?.({
      triggeredBy: event.detail.isManual ? 'drag' : 'startRefresh',
    })
  }

  // The native release event is not yet declared in the public element types.
  const refreshViewProps = {
    bindheaderreleased: () => {
      refreshProps?.onHeaderReleased?.({
        offset: refreshOffset.current,
        headerSize: refreshHeaderSize.current,
      })
    },
  }

  const coordinator = (
    <scroll-coordinator
      {...coordinatorProps}
      ref={nativeRef}
      id={id}
      className={clsx('lynx-ui-scroll-coordinator__root', {
        'ui-sticky': isSticky,
      }, !hasRefresh && className)}
      style={hasRefresh ? undefined : style}
      granularity={granularity}
      {...(gesture ? { 'main-thread:gesture': gesture } : {})}
      bounces={popupOptions?.enableHalfToFullScreen
        ? false
        : enableRefresh || bounces}
      android-enable-touch-stop-fling={true}
      enable-scroll={enableScroll}
      enable-scroll-bar={scrollBarEnable}
      header-over-slot={headerOverSlot}
      experimental-header-slot-overflow-hit-test={!experimentalOverflowHitTestFallback}
      refresh-mode={enableRefresh ? 'fold' : (refreshInSlot ? 'page' : 'none')}
      bindoffset={bindOffset}
      {...(onOffsetChangeMT
        ? { 'main-thread:bindoffset': handleOffsetMT }
        : {})}
      name={popupOptions?.name}
      compat-container-popup={Boolean(popupOptions?.enableHalfToFullScreen)}
      android-nested-scroll-as-child={scrollWithNative}
    >
      {toolbar != null && (
        <scroll-coordinator-toolbar className='lynx-ui-scroll-coordinator__toolbar'>
          {toolbar}
        </scroll-coordinator-toolbar>
      )}
      <scroll-coordinator-header
        ref={headerRef}
        id={id ? `${id}-header` : undefined}
        className='lynx-ui-scroll-coordinator__header'
        style={hasRefresh ? { minHeight: '1px' } : { height: 'max-content' }}
      >
        {headers}
      </scroll-coordinator-header>
      <scroll-coordinator-slot className='lynx-ui-scroll-coordinator__slot'>
        {slot}
      </scroll-coordinator-slot>
    </scroll-coordinator>
  )

  if (!hasRefresh) return coordinator

  return (
    <refresh
      {...refreshViewProps}
      ref={refreshRef}
      id={id ? `${id}-refresh` : undefined}
      className={clsx('lynx-ui-scroll-coordinator__refresh', className, {
        'ui-sticky': isSticky,
      })}
      style={style}
      enable-refresh={enableRefresh}
      enable-loadmore={false}
      detect-scrollchild={true}
      bindstartrefresh={handleStartRefresh}
      bindheaderoffset={handleRefreshOffset}
      bindrefreshstatechange={(event: RefreshStateChangeEvent) => {
        refreshProps?.onRefreshStateChange?.({ state: event.detail.state })
      }}
    >
      <refresh-header
        className='lynx-ui-scroll-coordinator__refresh-header'
        bindlayoutchange={handleRefreshHeaderLayout}
      >
        {refreshProps.headerContent}
      </refresh-header>
      {coordinator}
    </refresh>
  )
}
