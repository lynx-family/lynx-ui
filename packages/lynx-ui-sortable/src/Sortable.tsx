// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import {
  runOnBackground,
  runOnMainThread,
  useCallback,
  useContext,
  useEffect,
  useMainThreadRef,
  useMemo,
  useRef,
} from '@lynx-js/react'
import type { RefObject } from '@lynx-js/react'

import type { Point } from '@lynx-js/lynx-ui-common'
import {
  Draggable,
  DraggableArea,
  DraggableRoot,
} from '@lynx-js/lynx-ui-draggable'
import type { DraggableRef } from '@lynx-js/lynx-ui-draggable'
import type { MainThread, ScrollEvent } from '@lynx-js/types'

import { SortableContext } from './SortableContext'
import type { SortableItemProps, SortableRootProps } from './types'
import { useSortable } from './useSortable'

export { DraggableArea as SortableItemArea }

type RectTarget = 'item' | 'boundary' | 'scrollableBoundary'
interface ScrollByResult {
  scrollTop?: number
  detail?: { scrollTop?: number }
}
interface ScrollTranslateDelta {
  dragDeltaY: number
  measuredRectDeltaY: number
}
interface VerticalBounds {
  top: number
  bottom: number
}
interface EdgeDistance {
  distanceToTop: number
  distanceToBottom: number
}
interface ClippedOverflowResult {
  clippedStickyDirection: number
  overflow: number
}

const AUTO_SCROLL_QUANTUM = 8 / 11
const AUTO_SCROLL_MAX_STEP = 18
const AUTO_SCROLL_VELOCITY_FACTOR = 0.35

function getNormalizedElementKey(sortingKey: string) {
  return String(sortingKey).replace(/[^\w-]/g, '-')
}

function getSortableItemElementId(sortingKey: string) {
  return `sortable-item-${getNormalizedElementKey(sortingKey)}`
}

function getSortableDragOverlayElementId(sortingKey: string) {
  return `sortable-drag-overlay-${getNormalizedElementKey(sortingKey)}`
}

function getEdgeDistance(
  itemBounds: VerticalBounds,
  boundaryRect: VerticalBounds,
): EdgeDistance {
  'main thread'
  return {
    distanceToTop: itemBounds.top - boundaryRect.top,
    distanceToBottom: boundaryRect.bottom - itemBounds.bottom,
  }
}

function getClippedStickyDirection(edgeDistance: EdgeDistance) {
  'main thread'
  if (edgeDistance.distanceToTop < 0) {
    return -1
  }
  if (edgeDistance.distanceToBottom < 0) {
    return 1
  }
  return 0
}

function getStickyOverflow(
  edgeDistance: EdgeDistance,
  stickyUpperOffset: number,
  stickyLowerOffset: number,
) {
  'main thread'
  if (edgeDistance.distanceToTop < stickyUpperOffset) {
    return edgeDistance.distanceToTop - stickyUpperOffset
  }
  if (edgeDistance.distanceToBottom < stickyLowerOffset) {
    return stickyLowerOffset - edgeDistance.distanceToBottom
  }
  return 0
}

function getClippedAutoScrollOverflow(
  clippedStickyDirection: number,
  overflow: number,
  edgeDistance: EdgeDistance,
  stickyUpperOffset: number,
  stickyLowerOffset: number,
): ClippedOverflowResult {
  'main thread'
  if (clippedStickyDirection < 0) {
    if (edgeDistance.distanceToTop >= stickyUpperOffset) {
      return { clippedStickyDirection: 0, overflow }
    }
    if (overflow < 0) {
      return { clippedStickyDirection, overflow: 0 }
    }
  } else if (clippedStickyDirection > 0) {
    if (edgeDistance.distanceToBottom >= stickyLowerOffset) {
      return { clippedStickyDirection: 0, overflow }
    }
    if (overflow > 0) {
      return { clippedStickyDirection, overflow: 0 }
    }
  }
  return { clippedStickyDirection, overflow }
}

export function SortableRoot<T>(props: SortableRootProps<T>) {
  const {
    children,
    data,
    debugLog = false,
    boundaryId,
    scrollableBoundaryId,
    scrollable = false,
    scrollableClassName,
    scrollableContentClassName,
    scrollableEnableScroll = true,
    scrollableStickyUpperOffset = 0,
    scrollableStickyLowerOffset = 0,
    onSortEnd,
    onSortStart,
    enableSorting = true,
  } = props
  const scrollableElementId = useMemo(
    () => scrollableBoundaryId ?? 'sortable-scrollable-boundary',
    [scrollableBoundaryId],
  )
  const scrollableContentId = useMemo(
    () => boundaryId ?? 'sortable-scrollable-content',
    [boundaryId],
  )
  const sizeMap = useMainThreadRef<Record<string, number>>({})
  const childrenRefMap = useMainThreadRef<
    Record<string, DraggableRef | null>
  >(
    {},
  )
  const childrenMTSRefMap = useMainThreadRef<
    Record<string, DraggableRef | null>
  >(
    {},
  )
  const dragOverlayRefMap = useMainThreadRef<
    Record<string, MainThread.Element | null>
  >(
    {},
  )
  const scrollableBoundaryUpperEdgeRef = useMainThreadRef(false)
  const scrollableBoundaryLowerEdgeRef = useMainThreadRef(false)
  const scrollableScrollTopRef = useMainThreadRef(0)
  const updateItemSize = useCallback((sortingKey: string, size: number) => {
    'main thread'
    sizeMap.current[sortingKey] = size
  }, [])

  const handleScrollableBoundaryScroll = useCallback((event: ScrollEvent) => {
    'main thread'
    scrollableScrollTopRef.current = event.detail.scrollTop
  }, [scrollableScrollTopRef])

  const handleScrollableBoundaryUpperExposure = useCallback(() => {
    'main thread'
    scrollableBoundaryUpperEdgeRef.current = true
  }, [scrollableBoundaryUpperEdgeRef])

  const handleScrollableBoundaryUpperDisexposure = useCallback(() => {
    'main thread'
    scrollableBoundaryUpperEdgeRef.current = false
  }, [scrollableBoundaryUpperEdgeRef])

  const handleScrollableBoundaryLowerExposure = useCallback(() => {
    'main thread'
    scrollableBoundaryLowerEdgeRef.current = true
  }, [scrollableBoundaryLowerEdgeRef])

  const handleScrollableBoundaryLowerDisexposure = useCallback(() => {
    'main thread'
    scrollableBoundaryLowerEdgeRef.current = false
  }, [scrollableBoundaryLowerEdgeRef])

  const setChildrenRef = useCallback(
    (refI: RefObject<DraggableRef>, key: string) => {
      'main thread'
      childrenRefMap.current[key] = refI.current
    },
    [],
  )

  const setChildrenMTSRef = useCallback((
    refI: RefObject<DraggableRef>,
    key: string,
  ) => {
    'main thread'
    childrenMTSRefMap.current[key] = refI.current
  }, [])

  const setDragOverlayRef = useCallback((
    refI: RefObject<MainThread.Element | null>,
    key: string,
  ) => {
    'main thread'
    dragOverlayRefMap.current[key] = refI.current
  }, [dragOverlayRefMap])

  const { handleDragEnd, handleDragMove, handleDragStart } = useSortable({
    data: data as SortableData<unknown>[],
    sizeMap: sizeMap,
    itemRefMap: childrenRefMap,
    itemMTSRefMap: childrenMTSRefMap,
    onDragEnd: onSortEnd,
    onDragStart: onSortStart,
    debugLog,
  })
  const sortableContextValue = useMemo(() => ({
    data,
    isDragOverlay: false,
    debugLog,
    enableSorting,
    boundaryId: scrollable ? scrollableContentId : boundaryId,
    scrollableBoundaryId: scrollable
      ? scrollableElementId
      : scrollableBoundaryId,
    scrollableBoundaryUpperEdgeRef: scrollable
      ? scrollableBoundaryUpperEdgeRef
      : undefined,
    scrollableBoundaryLowerEdgeRef: scrollable
      ? scrollableBoundaryLowerEdgeRef
      : undefined,
    scrollableScrollTopRef: scrollable
      ? scrollableScrollTopRef
      : undefined,
    dragOverlayRefMap: scrollable ? dragOverlayRefMap : undefined,
    scrollableStickyUpperOffset,
    scrollableStickyLowerOffset,
    updateItemSize,
    setChildrenRef,
    setChildrenMTSRef,
    setDragOverlayRef,
    handleDragEnd,
    handleDragMove,
    handleDragStart,
  }), [
    data,
    debugLog,
    enableSorting,
    boundaryId,
    scrollable,
    scrollableContentId,
    scrollableElementId,
    scrollableBoundaryId,
    scrollableBoundaryLowerEdgeRef,
    scrollableBoundaryUpperEdgeRef,
    scrollableScrollTopRef,
    dragOverlayRefMap,
    scrollableStickyLowerOffset,
    scrollableStickyUpperOffset,
    updateItemSize,
    setChildrenRef,
    setChildrenMTSRef,
    setDragOverlayRef,
    handleDragEnd,
    handleDragMove,
    handleDragStart,
  ])

  const sortableDragOverlayContextValue = useMemo(() => ({
    ...sortableContextValue,
    isDragOverlay: true,
  }), [sortableContextValue])

  const renderedChildren = useMemo(
    () => data?.map(item => children(item)),
    [data, children],
  )

  const renderedDragOverlayChildren = useMemo(
    () => data?.map(item => children(item)),
    [data, children],
  )

  if (scrollable) {
    return (
      <>
        <scroll-view
          id={scrollableElementId}
          className={scrollableClassName}
          enable-scroll={scrollableEnableScroll}
          scroll-orientation='vertical'
          main-thread:bindscroll={handleScrollableBoundaryScroll}
        >
          <view
            id={scrollableContentId}
            className={scrollableContentClassName}
            style={{ zIndex: '0' }}
          >
            <view
              style='display: flex; flex-direction: column; overflow:hidden; height: 1ppx; width: 100%;'
              exposure-scene={scrollableElementId}
              exposure-id='upperExposureView'
              id={`${scrollableElementId}-upperExposureView`}
              main-thread:binduiappear={handleScrollableBoundaryUpperExposure}
              main-thread:binduidisappear={handleScrollableBoundaryUpperDisexposure}
            />
            <SortableContext.Provider
              value={sortableContextValue}
            >
              {renderedChildren}
            </SortableContext.Provider>
            <view
              style='display: flex; flex-direction: column; overflow:hidden; height: 1ppx; width: 100%;'
              exposure-scene={scrollableElementId}
              exposure-id='lowerExposureView'
              id={`${scrollableElementId}-lowerExposureView`}
              main-thread:binduiappear={handleScrollableBoundaryLowerExposure}
              main-thread:binduidisappear={handleScrollableBoundaryLowerDisexposure}
            />
          </view>
        </scroll-view>
        <SortableContext.Provider
          value={sortableDragOverlayContextValue}
        >
          {renderedDragOverlayChildren}
        </SortableContext.Provider>
      </>
    )
  }

  return (
    <SortableContext.Provider
      value={sortableContextValue}
    >
      {renderedChildren}
    </SortableContext.Provider>
  )
}

interface boundingClientRectRes {
  height: number
  width: number
  top: number
  left: number
  bottom: number
  right: number
}

export function SortableItem(props: SortableItemProps) {
  const { isDragOverlay } = useContext(SortableContext)
  if (isDragOverlay) {
    return <SortableDragOverlayItem {...props} />
  }

  return <SortableInteractiveItem {...props} />
}

function SortableDragOverlayItem(props: SortableItemProps) {
  const { className, children, sortingKey } = props
  const { setDragOverlayRef } = useContext(SortableContext)
  const overlayRef = useMainThreadRef<MainThread.Element | null>(null)
  const overlayElementId = useMemo(
    () => getSortableDragOverlayElementId(sortingKey),
    [sortingKey],
  )
  const overlayStyle = useMemo(() => ({
    position: 'fixed',
    top: '0px',
    left: '0px',
    width: '0px',
    height: '0px',
    opacity: 0,
    visibility: 'hidden',
    // zIndex: '10000',
    transform: 'translate(0px, 0px)',
  } as const), [])

  useEffect(() => {
    runOnMainThread(setDragOverlayRef)(overlayRef, sortingKey)
  }, [overlayRef, setDragOverlayRef, sortingKey])

  return (
    <view
      id={overlayElementId}
      className={className}
      main-thread:ref={overlayRef}
      style={overlayStyle}
      user-interaction-enabled={false}
    >
      {children}
    </view>
  )
}

function SortableInteractiveItem(props: SortableItemProps) {
  const { className, children, sortingKey, as = 'Draggable' } = props
  const {
    data,
    enableSorting,
    boundaryId,
    scrollableBoundaryId,
    scrollableBoundaryUpperEdgeRef,
    scrollableBoundaryLowerEdgeRef,
    scrollableScrollTopRef,
    dragOverlayRefMap,
    scrollableStickyUpperOffset,
    scrollableStickyLowerOffset,
    updateItemSize,
    setChildrenRef,
    setChildrenMTSRef,
    handleDragStart,
    handleDragEnd,
    handleDragMove,
  } = useContext(SortableContext)

  const MTSRef = useMainThreadRef<DraggableRef>(null)
  const itemRect = useMainThreadRef<boundingClientRectRes>({
    height: 0,
    width: 0,
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  })
  const boundaryRect = useMainThreadRef<boundingClientRectRes>({
    height: 0,
    width: 0,
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  })
  const scrollableBoundaryRect = useMainThreadRef<
    boundingClientRectRes
  >({
    height: 0,
    width: 0,
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  })
  const itemRectCopy = useRef<boundingClientRectRes>({
    height: 0,
    width: 0,
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  })
  const boundaryRectCopy = useRef<boundingClientRectRes>({
    height: 0,
    width: 0,
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  })
  const scrollableBoundaryRectCopy = useRef<boundingClientRectRes>({
    height: 0,
    width: 0,
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  })
  const autoScrollingRef = useMainThreadRef(false)
  const lastAutoScrollTranslateY = useMainThreadRef(0)
  const autoScrollDistanceSum = useMainThreadRef(0)
  const pendingAutoScrollDistance = useMainThreadRef(0)
  const autoScrollCompensationY = useMainThreadRef(0)
  const autoScrollStartScrollTop = useMainThreadRef(0)
  const itemMeasuredScrollTop = useMainThreadRef(0)
  const dragStartScrollDeltaFromMeasuredRect = useMainThreadRef(0)
  const autoScrollOverflow = useMainThreadRef(0)
  const autoScrollDirection = useMainThreadRef(0)
  const autoScrollStickyDirection = useMainThreadRef(0)
  const dragStartClippedStickyDirection = useMainThreadRef(0)
  const dragOverlayActive = useMainThreadRef(false)
  const dragSourceHidden = useMainThreadRef(false)
  const latestDragTranslate = useMainThreadRef<Point>({ x: 0, y: 0 })
  const latestDragEvent = useMainThreadRef<
    MainThread.MouseEvent | MainThread.TouchEvent | null
  >(null)
  const autoScrollFrameRef = useMainThreadRef<(() => void) | null>(null)
  const syncScrollDeltaForItemTranslateY = useCallback((
    scrollByResult?: ScrollByResult,
    fallbackScrollByOffset = 0,
  ): ScrollTranslateDelta => {
    'main thread'
    if (scrollableScrollTopRef) {
      const previousScrollTop = scrollableScrollTopRef.current
      const scrollTop = scrollByResult?.scrollTop
        ?? scrollByResult?.detail?.scrollTop
      if (typeof scrollTop === 'number') {
        scrollableScrollTopRef.current = scrollTop
      } else if (scrollByResult || fallbackScrollByOffset !== 0) {
        scrollableScrollTopRef.current += fallbackScrollByOffset
      }

      if (scrollByResult || fallbackScrollByOffset !== 0) {
        autoScrollDistanceSum.current += scrollableScrollTopRef.current
          - previousScrollTop
      }
      autoScrollCompensationY.current = scrollableScrollTopRef.current
        - autoScrollStartScrollTop.current
      return {
        dragDeltaY: autoScrollCompensationY.current,
        measuredRectDeltaY: scrollableScrollTopRef.current
          - itemMeasuredScrollTop.current,
      }
    }

    if (fallbackScrollByOffset !== 0) {
      autoScrollDistanceSum.current += fallbackScrollByOffset
      autoScrollCompensationY.current += fallbackScrollByOffset
    }
    return {
      dragDeltaY: autoScrollCompensationY.current,
      measuredRectDeltaY: dragStartScrollDeltaFromMeasuredRect.current
        + autoScrollDistanceSum.current,
    }
  }, [
    autoScrollDistanceSum,
    autoScrollCompensationY,
    autoScrollStartScrollTop,
    dragStartScrollDeltaFromMeasuredRect,
    itemMeasuredScrollTop,
    scrollableScrollTopRef,
  ])

  const itemElementId = useMemo(
    () => getSortableItemElementId(sortingKey),
    [sortingKey],
  )
  const setAutoScrolling = useCallback((isAutoScrolling: boolean) => {
    'main thread'
    autoScrollingRef.current = isAutoScrolling
  }, [autoScrollingRef])
  const setItemRectOnMainThread = useCallback((rect: boundingClientRectRes) => {
    'main thread'
    itemRect.current = rect
    itemMeasuredScrollTop.current = scrollableScrollTopRef?.current ?? 0
  }, [itemMeasuredScrollTop, itemRect, scrollableScrollTopRef])
  const setBoundaryRectOnMainThread = useCallback(
    (rect: boundingClientRectRes) => {
      'main thread'
      boundaryRect.current = rect
    },
    [boundaryRect],
  )
  const setScrollableBoundaryRectOnMainThread = useCallback(
    (rect: boundingClientRectRes) => {
      'main thread'
      scrollableBoundaryRect.current = rect
    },
    [scrollableBoundaryRect],
  )
  const syncItemRectCopy = useCallback((rect: boundingClientRectRes) => {
    itemRectCopy.current = rect
  }, [])
  const syncBoundaryRectCopy = useCallback((rect: boundingClientRectRes) => {
    boundaryRectCopy.current = rect
  }, [])
  const syncScrollableBoundaryRectCopy = useCallback(
    (rect: boundingClientRectRes) => {
      scrollableBoundaryRectCopy.current = rect
    },
    [],
  )

  const measureRectById = useCallback((
    id: string | undefined,
    target: RectTarget,
  ) => {
    'main thread'
    if (!id) {
      return
    }

    const element = lynx.querySelector(`#${id}`)
    element?.invoke('boundingClientRect', {})
      .then((res) => {
        const rect = res as boundingClientRectRes
        if (target === 'item') {
          setItemRectOnMainThread(rect)
          runOnBackground(syncItemRectCopy)(rect)
          return
        }
        if (target === 'boundary') {
          setBoundaryRectOnMainThread(rect)
          runOnBackground(syncBoundaryRectCopy)(rect)
          return
        }

        setScrollableBoundaryRectOnMainThread(rect)
        runOnBackground(syncScrollableBoundaryRectCopy)(rect)
      })
  }, [
    setBoundaryRectOnMainThread,
    setItemRectOnMainThread,
    setScrollableBoundaryRectOnMainThread,
    syncBoundaryRectCopy,
    syncItemRectCopy,
    syncScrollableBoundaryRectCopy,
  ])

  const refreshDraggingRects = useCallback(() => {
    'main thread'
    measureRectById(itemElementId, 'item')
    measureRectById(boundaryId, 'boundary')
    measureRectById(scrollableBoundaryId, 'scrollableBoundary')
  }, [
    boundaryId,
    itemElementId,
    measureRectById,
    scrollableBoundaryId,
  ])

  const scrollScrollableBoundaryBy = useCallback((
    offset: number,
    onScrolled?: () => void,
  ) => {
    'main thread'
    if (
      !scrollableBoundaryId
      || offset === 0
    ) {
      onScrolled?.()
      return
    }

    const element = lynx.querySelector(`#${scrollableBoundaryId}`)
    if (!element) {
      onScrolled?.()
      return
    }

    element.invoke('scrollBy', {
      offset,
    }).then((res) => {
      'main thread'
      syncScrollDeltaForItemTranslateY(res as ScrollByResult, offset)
      onScrolled?.()
    })
  }, [
    autoScrollingRef,
    scrollableBoundaryId,
    sortingKey,
    syncScrollDeltaForItemTranslateY,
  ])

  const isAutoScrollBlocked = useCallback((offset: number) => {
    'main thread'
    if (offset > 0) { // block autoScroll down when at lower edge
      return scrollableBoundaryLowerEdgeRef?.current === true
    }
    if (offset < 0) { // block autoScroll up when at upper edge
      return scrollableBoundaryUpperEdgeRef?.current === true
    }
    return false
  }, [scrollableBoundaryLowerEdgeRef, scrollableBoundaryUpperEdgeRef])

  const consumeQuantizedAutoScroll = useCallback((offset: number) => {
    'main thread'
    if (isAutoScrollBlocked(offset)) {
      pendingAutoScrollDistance.current = 0
      return 0
    }

    // if (offset > 0) {
    //   if (scrollableBoundaryUpperEdgeRef) {
    //     scrollableBoundaryUpperEdgeRef.current = false
    //   }
    // } else if (offset < 0 && scrollableBoundaryLowerEdgeRef) {
    //   scrollableBoundaryLowerEdgeRef.current = false
    // }

    pendingAutoScrollDistance.current += offset
    const quantumCount = Math.trunc(
      pendingAutoScrollDistance.current / AUTO_SCROLL_QUANTUM,
    )
    if (quantumCount === 0) {
      return 0
    }

    const quantizedOffset = quantumCount * AUTO_SCROLL_QUANTUM
    if (isAutoScrollBlocked(quantizedOffset)) {
      pendingAutoScrollDistance.current = 0
      return 0
    }

    pendingAutoScrollDistance.current -= quantizedOffset
    return quantizedOffset
  }, [
    isAutoScrollBlocked,
    pendingAutoScrollDistance,
    scrollableBoundaryLowerEdgeRef,
    scrollableBoundaryUpperEdgeRef,
  ])

  const getDragStartItemBounds = useCallback((translateY: number) => {
    'main thread'
    const measuredTopAtDragStart = itemRect.current.top
      - dragStartScrollDeltaFromMeasuredRect.current
    const measuredBottomAtDragStart = itemRect.current.bottom
      - dragStartScrollDeltaFromMeasuredRect.current

    return {
      top: measuredTopAtDragStart + translateY,
      bottom: measuredBottomAtDragStart + translateY,
    }
  }, [dragStartScrollDeltaFromMeasuredRect, itemRect])

  const getAutoScrollOverflow = useCallback((
    distanceToTop: number,
    distanceToBottom: number,
  ) => {
    'main thread'
    return getStickyOverflow(
      { distanceToTop, distanceToBottom },
      scrollableStickyUpperOffset,
      scrollableStickyLowerOffset,
    )
  }, [scrollableStickyLowerOffset, scrollableStickyUpperOffset])

  const getDragStartClippedStickyDirection = useCallback(() => {
    'main thread'
    if (!scrollableBoundaryId || scrollableBoundaryRect.current.height <= 0) {
      return 0
    }

    const draggedItem = getDragStartItemBounds(0)
    return getClippedStickyDirection(
      getEdgeDistance(draggedItem, scrollableBoundaryRect.current),
    )
  }, [
    getDragStartItemBounds,
    scrollableBoundaryId,
    scrollableBoundaryRect,
  ])

  const getDragStartClippedAutoScrollOverflow = useCallback((
    overflow: number,
    distanceToTop: number,
    distanceToBottom: number,
  ) => {
    'main thread'
    const result = getClippedAutoScrollOverflow(
      dragStartClippedStickyDirection.current,
      overflow,
      { distanceToTop, distanceToBottom },
      scrollableStickyUpperOffset,
      scrollableStickyLowerOffset,
    )
    dragStartClippedStickyDirection.current = result.clippedStickyDirection
    return result.overflow
  }, [
    dragStartClippedStickyDirection,
    scrollableStickyLowerOffset,
    scrollableStickyUpperOffset,
  ])

  const getAutoScrollDirection = useCallback((
    stickyDirection: number,
    translateDeltaY: number,
  ) => {
    'main thread'
    if (translateDeltaY === 0) {
      return autoScrollDirection.current || stickyDirection
    }

    const dragDirection = translateDeltaY > 0 ? 1 : -1
    return dragDirection === stickyDirection ? stickyDirection : 0
  }, [autoScrollDirection])

  const getVisualTranslateY = useCallback(() => {
    'main thread'
    const scrollDelta = syncScrollDeltaForItemTranslateY()
    if (autoScrollStickyDirection.current > 0) {
      return scrollableBoundaryRect.current.bottom
        - itemRect.current.bottom
        - scrollableStickyLowerOffset
        + scrollDelta.measuredRectDeltaY
    }
    if (autoScrollStickyDirection.current < 0) {
      return scrollableBoundaryRect.current.top
        - itemRect.current.top
        + scrollableStickyUpperOffset
        + scrollDelta.measuredRectDeltaY
    }
    return latestDragTranslate.current.y + scrollDelta.dragDeltaY
  }, [
    autoScrollStickyDirection,
    itemRect,
    latestDragTranslate,
    scrollableBoundaryRect,
    scrollableStickyLowerOffset,
    scrollableStickyUpperOffset,
    syncScrollDeltaForItemTranslateY,
  ])

  const getStickyTranslateY = useCallback((stickyDirection: number) => {
    'main thread'
    const scrollDelta = syncScrollDeltaForItemTranslateY()
    if (stickyDirection > 0) {
      return scrollableBoundaryRect.current.bottom
        - itemRect.current.bottom
        - scrollableStickyLowerOffset
        + scrollDelta.measuredRectDeltaY
    }
    if (stickyDirection < 0) {
      return scrollableBoundaryRect.current.top
        - itemRect.current.top
        + scrollableStickyUpperOffset
        + scrollDelta.measuredRectDeltaY
    }
    return latestDragTranslate.current.y + scrollDelta.dragDeltaY
  }, [
    itemRect,
    latestDragTranslate,
    scrollableBoundaryRect,
    scrollableStickyLowerOffset,
    scrollableStickyUpperOffset,
    syncScrollDeltaForItemTranslateY,
  ])

  const getVisualBounds = useCallback((visualTranslateY: number) => {
    'main thread'
    const scrollDelta = syncScrollDeltaForItemTranslateY()
    return {
      top: itemRect.current.top
        - scrollDelta.measuredRectDeltaY
        + visualTranslateY,
      bottom: itemRect.current.bottom
        - scrollDelta.measuredRectDeltaY
        + visualTranslateY,
      left: itemRect.current.left + latestDragTranslate.current.x,
      right: itemRect.current.right + latestDragTranslate.current.x,
      width: itemRect.current.width,
      height: itemRect.current.height,
    }
  }, [
    itemRect,
    latestDragTranslate,
    syncScrollDeltaForItemTranslateY,
  ])

  const getVisualEdgeDistance = useCallback((visualTranslateY: number) => {
    'main thread'
    return getEdgeDistance(
      getVisualBounds(visualTranslateY),
      scrollableBoundaryRect.current,
    )
  }, [getVisualBounds, scrollableBoundaryRect])

  const logStickyPosition = useCallback((
    visualTranslateY: number,
    rawStickyDirection: number,
    overflow: number,
    rawOverflow: number,
    scrollDirection: number,
    blockedByScrollableEdge: boolean,
    distanceToTop: number,
    distanceToBottom: number,
    translateY: number,
  ) => {
    'main thread'
    if (
      rawStickyDirection === 0 && dragStartClippedStickyDirection.current === 0
    ) {
      return
    }

    const stickyTranslateY = getStickyTranslateY(rawStickyDirection)
    const visualEdgeDistance = getVisualEdgeDistance(visualTranslateY)
    console.info(
      `[lynx-ui-sortable][SortableItem] stickyPosition, sortableKey: ${sortingKey}, translateY: ${translateY}, visualTranslateY: ${visualTranslateY}, stickyTranslateY: ${stickyTranslateY}, stickyDeltaY: ${
        visualTranslateY - stickyTranslateY
      }, rawStickyDirection: ${rawStickyDirection}, overflow: ${overflow}, rawOverflow: ${rawOverflow}, scrollDirection: ${scrollDirection}, blockedByScrollableEdge: ${blockedByScrollableEdge}, dragStartClippedStickyDirection: ${dragStartClippedStickyDirection.current}, distanceToTop: ${distanceToTop}, distanceToBottom: ${distanceToBottom}, visualDistanceToTop: ${visualEdgeDistance.distanceToTop}, visualDistanceToBottom: ${visualEdgeDistance.distanceToBottom}`,
    )
  }, [
    dragStartClippedStickyDirection,
    getVisualEdgeDistance,
    getStickyTranslateY,
    sortingKey,
  ])

  const getDragOverlayElement = useCallback(() => {
    'main thread'
    return dragOverlayRefMap?.current?.[sortingKey] ?? null
  }, [dragOverlayRefMap, sortingKey])

  const hideDragSourceItem = useCallback(() => {
    'main thread'
    if (!scrollableBoundaryId || dragSourceHidden.current) {
      return
    }

    MTSRef.current?.MTSSetOtherStyles({
      visibility: 'hidden',
      opacity: '0',
    })
    dragSourceHidden.current = true
  }, [
    MTSRef,
    dragSourceHidden,
    scrollableBoundaryId,
  ])

  const showDragSourceItem = useCallback(() => {
    'main thread'
    if (!dragSourceHidden.current) {
      return
    }

    MTSRef.current?.MTSSetOtherStyles({
      visibility: 'visible',
      opacity: '1',
    })
    dragSourceHidden.current = false
  }, [
    MTSRef,
    dragSourceHidden,
  ])

  const updateDragOverlayTransform = useCallback((visualTranslateY: number) => {
    'main thread'
    if (!dragOverlayActive.current) {
      return
    }

    const overlay = getDragOverlayElement()
    if (!overlay) {
      return
    }

    const bounds = getVisualBounds(visualTranslateY)
    overlay.setStyleProperty(
      'transform',
      `translate(${bounds.left}px, ${bounds.top}px)`,
    )
  }, [
    dragOverlayActive,
    getDragOverlayElement,
    getVisualBounds,
  ])

  const activateDragOverlay = useCallback(() => {
    'main thread'
    if (!scrollableBoundaryId) {
      return
    }

    hideDragSourceItem()

    const overlay = getDragOverlayElement()
    if (!overlay) {
      return
    }

    dragOverlayActive.current = true

    const visualTranslateY = getVisualTranslateY()
    const bounds = getVisualBounds(visualTranslateY)
    overlay.setStyleProperties({
      position: 'fixed',
      top: '0px',
      left: '0px',
      width: `${bounds.width}px`,
      height: `${bounds.height}px`,
      opacity: '1',
      visibility: 'visible',
      // 'z-index': '10000',
      transform: `translate(${bounds.left}px, ${bounds.top}px)`,
    })
  }, [
    dragOverlayActive,
    getDragOverlayElement,
    getVisualBounds,
    getVisualTranslateY,
    hideDragSourceItem,
    scrollableBoundaryId,
  ])

  const deactivateDragOverlay = useCallback(() => {
    'main thread'
    showDragSourceItem()

    if (!dragOverlayActive.current) {
      return
    }

    const overlay = getDragOverlayElement()
    if (overlay) {
      overlay.setStyleProperties({
        opacity: '0',
        visibility: 'hidden',
        transform: 'translate(0px, 0px)',
      })
    }
    dragOverlayActive.current = false
  }, [
    dragOverlayActive,
    getDragOverlayElement,
    showDragSourceItem,
  ])

  const applyVisualTranslate = useCallback(() => {
    'main thread'
    const visualTranslateY = getVisualTranslateY()
    if (dragOverlayActive.current) {
      MTSRef.current?.MTSSetTransform(0, 0)
      updateDragOverlayTransform(visualTranslateY)
    } else {
      MTSRef.current?.MTSSetTransform(
        latestDragTranslate.current.x,
        visualTranslateY,
      )
    }
    return visualTranslateY
  }, [
    MTSRef,
    dragOverlayActive,
    getVisualTranslateY,
    latestDragTranslate,
    updateDragOverlayTransform,
  ])

  const emitSortableDragMove = useCallback((
    visualTranslateY: number,
    event: MainThread.MouseEvent | MainThread.TouchEvent | null,
  ) => {
    'main thread'
    if (!event) {
      return
    }

    handleDragMove?.(
      { x: latestDragTranslate.current.x, y: visualTranslateY },
      sortingKey,
      event,
    )
  }, [handleDragMove, latestDragTranslate, sortingKey])

  const scheduleNextAutoScrollFrame = useCallback(() => {
    'main thread'
    const nextFrame = autoScrollFrameRef.current
    if (nextFrame) {
      setTimeout(nextFrame, 8)
    }
  }, [autoScrollFrameRef])

  const finishAutoScrollFrame = useCallback(() => {
    'main thread'
    const visualTranslateY = applyVisualTranslate()

    emitSortableDragMove(visualTranslateY, latestDragEvent.current)
    scheduleNextAutoScrollFrame()
  }, [
    applyVisualTranslate,
    emitSortableDragMove,
    latestDragEvent,
    scheduleNextAutoScrollFrame,
  ])

  const runAutoScrollFrame = useCallback(() => {
    'main thread'
    if (!autoScrollingRef.current) {
      return
    }

    const overflow = autoScrollOverflow.current
    if (overflow === 0) {
      setAutoScrolling(false)
      return
    }

    const direction = autoScrollDirection.current || (overflow > 0 ? 1 : -1)
    if (isAutoScrollBlocked(direction)) {
      pendingAutoScrollDistance.current = 0
      const visualTranslateY = applyVisualTranslate()
      emitSortableDragMove(visualTranslateY, latestDragEvent.current)
      setAutoScrolling(false)
      return
    }

    const step = direction * Math.min(
      AUTO_SCROLL_MAX_STEP,
      Math.max(
        AUTO_SCROLL_QUANTUM,
        Math.abs(overflow) * AUTO_SCROLL_VELOCITY_FACTOR,
      ),
    )
    const emittedOffset = consumeQuantizedAutoScroll(step)
    const finishScrolledFrame = () => {
      'main thread'
      finishAutoScrollFrame()
    }

    if (emittedOffset === 0) {
      finishScrolledFrame()
    } else {
      scrollScrollableBoundaryBy(emittedOffset, finishScrolledFrame)
    }
  }, [
    applyVisualTranslate,
    autoScrollDirection,
    autoScrollOverflow,
    autoScrollingRef,
    consumeQuantizedAutoScroll,
    emitSortableDragMove,
    finishAutoScrollFrame,
    isAutoScrollBlocked,
    latestDragEvent,
    pendingAutoScrollDistance,
    scrollScrollableBoundaryBy,
    setAutoScrolling,
  ])

  const startAutoScrollLoop = useCallback(() => {
    'main thread'
    if (autoScrollingRef.current) {
      return
    }
    autoScrollFrameRef.current = runAutoScrollFrame
    setAutoScrolling(true)
    scheduleNextAutoScrollFrame()
  }, [
    autoScrollingRef,
    runAutoScrollFrame,
    scheduleNextAutoScrollFrame,
    setAutoScrolling,
  ])

  const stopAutoScrollLoop = useCallback(() => {
    'main thread'
    autoScrollOverflow.current = 0
    autoScrollDirection.current = 0
    autoScrollStickyDirection.current = 0
    setAutoScrolling(false)
  }, [
    autoScrollDirection,
    autoScrollOverflow,
    autoScrollStickyDirection,
    setAutoScrolling,
  ])

  useEffect(() => {
    runOnMainThread(setChildrenMTSRef)(MTSRef, sortingKey)
    runOnMainThread(refreshDraggingRects)()
  }, [
    data,
    refreshDraggingRects,
    setChildrenRef,
    setChildrenMTSRef,
    sortingKey,
  ])

  const handleMTSLayoutChange = (e: MainThread.LayoutChangeEvent) => {
    'main thread'
    updateItemSize(sortingKey, e.detail.height)
  }

  const resetAutoScrollDragState = useCallback(() => {
    'main thread'
    lastAutoScrollTranslateY.current = 0
    autoScrollDistanceSum.current = 0
    pendingAutoScrollDistance.current = 0
    autoScrollCompensationY.current = 0
    autoScrollOverflow.current = 0
    autoScrollDirection.current = 0
    autoScrollStickyDirection.current = 0
    dragStartClippedStickyDirection.current = 0
    latestDragTranslate.current = { x: 0, y: 0 }
  }, [
    autoScrollCompensationY,
    autoScrollDirection,
    autoScrollDistanceSum,
    autoScrollOverflow,
    autoScrollStickyDirection,
    dragStartClippedStickyDirection,
    lastAutoScrollTranslateY,
    latestDragTranslate,
    pendingAutoScrollDistance,
  ])

  const itemDragStart = (
    pagePoint: Point,
    event: MainThread.MouseEvent | MainThread.TouchEvent,
  ) => {
    'main thread'
    resetAutoScrollDragState()
    const scrollTop = scrollableScrollTopRef?.current ?? 0
    autoScrollStartScrollTop.current = scrollTop
    dragStartScrollDeltaFromMeasuredRect.current = scrollTop
      - itemMeasuredScrollTop.current
    dragStartClippedStickyDirection.current =
      getDragStartClippedStickyDirection()
    latestDragEvent.current = event
    activateDragOverlay()
    handleDragStart?.(pagePoint, sortingKey, event)
  }

  const itemDragging = (
    translate: Point,
    event: MainThread.MouseEvent | MainThread.TouchEvent,
  ) => {
    'main thread'
    latestDragTranslate.current = translate
    latestDragEvent.current = event
    if (scrollableBoundaryId && scrollableBoundaryRect.current.height > 0) {
      const draggedItem = getDragStartItemBounds(translate.y)
      const { distanceToTop, distanceToBottom } = getEdgeDistance(
        draggedItem,
        scrollableBoundaryRect.current,
      )
      const translateDeltaY = translate.y - lastAutoScrollTranslateY.current
      const rawOverflow = getAutoScrollOverflow(distanceToTop, distanceToBottom)
      const overflow = getDragStartClippedAutoScrollOverflow(
        rawOverflow,
        distanceToTop,
        distanceToBottom,
      )

      lastAutoScrollTranslateY.current = translate.y

      if (overflow === 0) {
        stopAutoScrollLoop()
        const visualTranslateY = applyVisualTranslate()
        logStickyPosition(
          visualTranslateY,
          rawOverflow > 0 ? 1 : (rawOverflow < 0 ? -1 : 0),
          overflow,
          rawOverflow,
          0,
          false,
          distanceToTop,
          distanceToBottom,
          translate.y,
        )
        emitSortableDragMove(visualTranslateY, event)
      } else {
        const stickyDirection = overflow > 0 ? 1 : -1
        const rawStickyDirection = rawOverflow > 0 ? 1 : -1
        const scrollDirection = getAutoScrollDirection(
          stickyDirection,
          translateDeltaY,
        )
        const previousScrollDirection = autoScrollDirection.current
        if (
          previousScrollDirection !== 0
          && previousScrollDirection !== scrollDirection
        ) {
          pendingAutoScrollDistance.current = 0
        }
        autoScrollOverflow.current = overflow
        autoScrollStickyDirection.current = stickyDirection
        autoScrollDirection.current = scrollDirection
        const visualTranslateY = applyVisualTranslate()
        const blockedByScrollableEdge = scrollDirection !== 0
          && isAutoScrollBlocked(scrollDirection)
        if (scrollDirection === 0) {
          pendingAutoScrollDistance.current = 0
          setAutoScrolling(false)
        } else if (blockedByScrollableEdge) {
          pendingAutoScrollDistance.current = 0
          setAutoScrolling(false)
        } else {
          startAutoScrollLoop()
        }
        logStickyPosition(
          visualTranslateY,
          rawStickyDirection,
          overflow,
          rawOverflow,
          scrollDirection,
          blockedByScrollableEdge,
          distanceToTop,
          distanceToBottom,
          translate.y,
        )
        emitSortableDragMove(visualTranslateY, event)
      }
      return
    }

    handleDragMove?.(translate, sortingKey, event)
  }

  const itemDragEnd = (
    _pagePoint: Point,
    event: MainThread.MouseEvent | MainThread.TouchEvent,
  ) => {
    'main thread'
    deactivateDragOverlay()
    resetAutoScrollDragState()
    autoScrollStartScrollTop.current = 0
    dragStartScrollDeltaFromMeasuredRect.current = 0
    latestDragEvent.current = null
    stopAutoScrollLoop()
    handleDragEnd?.(sortingKey, event)
  }

  const resetStyle = useMemo(
    () => ({ transform: 'translate(0, 0)' }),
    [data],
  )

  if (as === 'Draggable') {
    return (
      <Draggable
        id={itemElementId}
        MTSRef={MTSRef}
        trigger='immediate'
        style={resetStyle}
        className={className}
        enableDragging={enableSorting}
        draggableProps={{
          'main-thread:bindlayoutchange': handleMTSLayoutChange,
        }}
        onMTSDragStart={itemDragStart}
        onMTSDragEnd={itemDragEnd}
        onMTSDragging={itemDragging}
        allowedDirection={['up', 'down']}
        {...(!scrollableBoundaryId && boundaryId
          && {
            minTranslateY:
              -(itemRectCopy.current.top - boundaryRectCopy.current.top),
            maxTranslateY: boundaryRectCopy.current.bottom
              - itemRectCopy.current.bottom,
          })}
      >
        {children}
      </Draggable>
    )
  } else {
    return (
      <DraggableRoot
        id={itemElementId}
        MTSRef={MTSRef}
        trigger='immediate'
        style={resetStyle}
        className={className}
        draggableProps={{
          'main-thread:bindlayoutchange': handleMTSLayoutChange,
        }}
        onMTSDragStart={itemDragStart}
        onMTSDragEnd={itemDragEnd}
        onMTSDragging={itemDragging}
        enableDragging={enableSorting}
        {...(!scrollableBoundaryId && boundaryId
          && {
            minTranslateY:
              -(itemRectCopy.current.top - boundaryRectCopy.current.top),
            maxTranslateY: boundaryRectCopy.current.bottom
              - itemRectCopy.current.bottom,
          })}
        allowedDirection={['up', 'down']}
      >
        {children}
      </DraggableRoot>
    )
  }
}
