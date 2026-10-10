// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import {
  memo,
  runOnMainThread,
  useCallback,
  useContext,
  useEffect,
  useMainThreadRef,
  useMemo,
  useState,
} from '@lynx-js/react'
import type { ReactNode, RefObject } from '@lynx-js/react'

import type { Point } from '@lynx-js/lynx-ui-common'
import { delayFrames, usePreCommit } from '@lynx-js/lynx-ui-common'
import {
  Draggable,
  DraggableArea,
  DraggableRoot,
} from '@lynx-js/lynx-ui-draggable'
import type { DraggableRef } from '@lynx-js/lynx-ui-draggable'
import type { MainThread, ScrollEvent } from '@lynx-js/types'

import { commitSortableOrder } from './commitSortableOrder'
import { SortableContext, SortableOrderContext } from './SortableContext'
import type { SortableContextType, SortableRect } from './SortableContext'
import type {
  SortableData,
  SortableItemProps,
  SortableRootProps,
} from './types'
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

function getAutoScrollTriggerOverflow(
  edgeDistance: EdgeDistance,
  upperTriggerZone: number,
  lowerTriggerZone: number,
) {
  'main thread'
  if (edgeDistance.distanceToTop < upperTriggerZone) {
    return edgeDistance.distanceToTop - upperTriggerZone
  }
  if (edgeDistance.distanceToBottom < lowerTriggerZone) {
    return lowerTriggerZone - edgeDistance.distanceToBottom
  }
  return 0
}

const AUTO_SCROLL_MAX_STEP = 18
const AUTO_SCROLL_VELOCITY_FACTOR = 0.35

interface SortableItemsProviderProps {
  children: ReactNode
  value: SortableContextType
}

const SortableItemsProvider = memo(function SortableItemsProvider(
  props: SortableItemsProviderProps,
) {
  return (
    <SortableContext.Provider value={props.value}>
      {props.children}
    </SortableContext.Provider>
  )
})

// A reorder preserves the item and renderer identities, so the entire gesture
// subtree can be reused. Content/configuration changes still render normally.
function RenderSortableItem<T>(props: {
  item: SortableData<T>
  renderItem: (item: SortableData<T>) => ReactNode
}) {
  return props.renderItem(props.item)
}
const SortableRenderedItem = memo(
  RenderSortableItem,
) as typeof RenderSortableItem

function SortableItemGeometryObserver(props: { refresh: () => void }) {
  const orderSignature = useContext(SortableOrderContext)
  useEffect(() => {
    delayFrames(1, props.refresh)
  }, [orderSignature, props.refresh])
  return null
}

function getNormalizedElementKey(sortingKey: string) {
  return String(sortingKey).replace(/[^\w-]/g, '-')
}

function getSortableItemElementId(sortingKey: string) {
  return `sortable-item-${getNormalizedElementKey(sortingKey)}`
}

function getSortableDragOverlayElementId(sortingKey: string) {
  return `sortable-drag-overlay-${getNormalizedElementKey(sortingKey)}`
}

export function SortableRoot<T>(props: SortableRootProps<T>) {
  const {
    children,
    data,
    debugLog = false,
    boundaryId,
    scrollableBoundaryId,
    as,
    scrollableClassName,
    scrollableContentClassName,
    scrollableEnableScroll = true,
    scrollableStickyUpperOffset = 0,
    scrollableStickyLowerOffset = 0,
    onSortEnd,
    onSortStart,
    enableSorting = true,
  } = props
  const scrollable = as === 'ScrollView'
  const [activeDragKey, setActiveDragKey] = useState<string | null>(null)
  const isDragging = activeDragKey !== null
  const handleInternalSortStart = useCallback((sortingKey: string) => {
    setActiveDragKey(sortingKey)
    onSortStart?.()
  }, [onSortStart])
  const handleInternalSortEnd = useCallback(
    (sortedData: SortableData<T>[]) => {
      setActiveDragKey(null)
      onSortEnd(sortedData)
    },
    [onSortEnd],
  )
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
  const dragOverlayActivatorRefMap = useMainThreadRef<
    Record<string, (() => void) | null>
  >(
    {},
  )
  const dirtyKeysRef = useMainThreadRef<Record<string, boolean>>({})
  const resetItemVisualsRef = useMainThreadRef<
    Record<string, (() => void) | undefined>
  >({})
  const keyArray = useMemo(
    () => data?.map(item => item.getSortingKey()) ?? [],
    [data],
  )
  const dataKeySignature = JSON.stringify(keyArray)
  const orderRef = useMainThreadRef(keyArray)
  usePreCommit(() => {
    'main thread'
    commitSortableOrder(
      orderRef,
      keyArray,
      dirtyKeysRef,
      resetItemVisualsRef,
      activeDragKey === null,
    )
  }, [dataKeySignature, activeDragKey])
  const disabledKeysRef = useMainThreadRef<Record<string, boolean>>({})
  const scrollableBoundaryUpperEdgeRef = useMainThreadRef(false)
  const scrollableBoundaryLowerEdgeRef = useMainThreadRef(false)
  const scrollableBoundaryRectRef = useMainThreadRef<SortableRect | null>(null)
  const scrollableBoundaryMeasurementVersion = useMainThreadRef(0)
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

  const measureScrollableBoundary = useCallback(() => {
    'main thread'
    if (!scrollable) {
      return
    }

    const measurementVersion = scrollableBoundaryMeasurementVersion.current + 1
    scrollableBoundaryMeasurementVersion.current = measurementVersion
    const measurement = lynx.querySelector(`#${scrollableElementId}`)
      ?.invoke('boundingClientRect', {})
    void measurement?.then((value) => {
      'main thread'
      if (
        scrollableBoundaryMeasurementVersion.current !== measurementVersion
      ) {
        return
      }
      scrollableBoundaryRectRef.current = value as SortableRect
    })
  }, [
    scrollable,
    scrollableBoundaryMeasurementVersion,
    scrollableBoundaryRectRef,
    scrollableElementId,
  ])

  const handleScrollableBoundaryLayoutChange = useCallback(() => {
    'main thread'
    measureScrollableBoundary()
  }, [measureScrollableBoundary])

  const invalidateScrollableBoundaryMeasurement = useCallback(() => {
    'main thread'
    scrollableBoundaryMeasurementVersion.current += 1
    scrollableBoundaryRectRef.current = null
  }, [scrollableBoundaryMeasurementVersion, scrollableBoundaryRectRef])

  useEffect(() => {
    if (scrollable) {
      runOnMainThread(measureScrollableBoundary)()
    }
    return () => {
      runOnMainThread(invalidateScrollableBoundaryMeasurement)()
    }
  }, [
    invalidateScrollableBoundaryMeasurement,
    measureScrollableBoundary,
    scrollable,
  ])

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
    const overlay = refI.current
    dragOverlayRefMap.current[key] = overlay
    if (overlay) {
      dragOverlayActivatorRefMap.current[key]?.()
    }
  }, [dragOverlayActivatorRefMap, dragOverlayRefMap])

  const clearDragOverlayRef = useCallback((key: string) => {
    'main thread'
    delete dragOverlayRefMap.current[key]
  }, [dragOverlayRefMap])

  const { handleDragEnd, handleDragMove, handleDragStart } = useSortable({
    data: data,
    orderRef,
    sizeMap: sizeMap,
    itemRefMap: childrenRefMap,
    itemMTSRefMap: childrenMTSRefMap,
    dirtyKeysRef,
    disabledKeysRef,
    onDragEnd: handleInternalSortEnd,
    onDragStart: handleInternalSortStart,
    debugLog,
  })
  const sortableContextValue = useMemo(() => ({
    isDragOverlay: false,
    debugLog,
    resetItemVisualsRef,
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
    scrollableBoundaryRectRef: scrollable
      ? scrollableBoundaryRectRef
      : undefined,
    scrollableScrollTopRef: scrollable
      ? scrollableScrollTopRef
      : undefined,
    dragOverlayRefMap: scrollable ? dragOverlayRefMap : undefined,
    dragOverlayActivatorRefMap: scrollable
      ? dragOverlayActivatorRefMap
      : undefined,
    dirtyKeysRef,
    disabledKeysRef,
    scrollableStickyUpperOffset,
    scrollableStickyLowerOffset,
    updateItemSize,
    setChildrenRef,
    setChildrenMTSRef,
    setDragOverlayRef,
    clearDragOverlayRef,
    handleDragEnd,
    handleDragMove,
    handleDragStart,
  }), [
    debugLog,
    resetItemVisualsRef,
    enableSorting,
    boundaryId,
    scrollable,
    scrollableContentId,
    scrollableElementId,
    scrollableBoundaryId,
    scrollableBoundaryLowerEdgeRef,
    scrollableBoundaryRectRef,
    scrollableBoundaryUpperEdgeRef,
    scrollableScrollTopRef,
    dragOverlayRefMap,
    dragOverlayActivatorRefMap,
    dirtyKeysRef,
    disabledKeysRef,
    scrollableStickyLowerOffset,
    scrollableStickyUpperOffset,
    updateItemSize,
    setChildrenRef,
    setChildrenMTSRef,
    setDragOverlayRef,
    clearDragOverlayRef,
    handleDragEnd,
    handleDragMove,
    handleDragStart,
  ])

  const sortableDragOverlayContextValue = useMemo(() => ({
    ...sortableContextValue,
    isDragOverlay: true,
  }), [sortableContextValue])

  const renderedChildren = useMemo(
    () =>
      data?.map(item => (
        <SortableRenderedItem
          key={item.getSortingKey()}
          item={item}
          renderItem={children}
        />
      )),
    [data, children],
  )

  const renderedDragOverlayChild = useMemo(() => {
    if (activeDragKey === null) {
      return null
    }

    const activeItem = data?.find(
      item => item.getSortingKey() === activeDragKey,
    )
    return activeItem ? children(activeItem) : null
  }, [activeDragKey, children, data])

  if (scrollable) {
    return (
      <>
        <scroll-view
          id={scrollableElementId}
          className={scrollableClassName}
          enable-scroll={scrollableEnableScroll && !isDragging}
          scroll-orientation='vertical'
          main-thread:bindlayoutchange={handleScrollableBoundaryLayoutChange}
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
            <SortableItemsProvider
              value={sortableContextValue}
            >
              {renderedChildren}
            </SortableItemsProvider>
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
          {renderedDragOverlayChild}
        </SortableContext.Provider>
      </>
    )
  }

  return (
    <SortableOrderContext.Provider value={dataKeySignature}>
      <SortableItemsProvider value={sortableContextValue}>
        {renderedChildren}
      </SortableItemsProvider>
    </SortableOrderContext.Provider>
  )
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
  const { clearDragOverlayRef, setDragOverlayRef } = useContext(SortableContext)
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
    zIndex: '10000',
    transform: 'translate(0px, 0px)',
  } as const), [])

  useEffect(() => {
    runOnMainThread(setDragOverlayRef)(overlayRef, sortingKey)
    return () => {
      runOnMainThread(clearDragOverlayRef)(sortingKey)
    }
  }, [clearDragOverlayRef, overlayRef, setDragOverlayRef, sortingKey])

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
  const {
    className,
    children,
    sortingKey,
    as = 'Draggable',
    disabled = false,
  } = props
  const {
    resetItemVisualsRef,
    enableSorting,
    boundaryId,
    scrollableBoundaryId,
    scrollableBoundaryUpperEdgeRef,
    scrollableBoundaryLowerEdgeRef,
    scrollableBoundaryRectRef,
    scrollableScrollTopRef,
    dragOverlayRefMap,
    dragOverlayActivatorRefMap,
    dirtyKeysRef,
    disabledKeysRef,
    scrollableStickyUpperOffset,
    scrollableStickyLowerOffset,
    updateItemSize,
    setChildrenMTSRef,
    handleDragStart,
    handleDragEnd,
    handleDragMove,
  } = useContext(SortableContext)

  const MTSRef = useMainThreadRef<DraggableRef>(null)
  const [itemRect, setItemRect] = useState<SortableRect>({
    height: 0,
    width: 0,
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  })
  const [boundaryRect, setBoundaryRect] = useState<SortableRect>({
    height: 0,
    width: 0,
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  })
  const [scrollableBoundaryRect, setScrollableBoundaryRect] = useState<
    SortableRect
  >({
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
  const autoScrollCompensationY = useMainThreadRef(0)
  const autoScrollStartScrollTop = useMainThreadRef(0)
  const itemMeasuredScrollTop = useMainThreadRef(0)
  const dragStartScrollDeltaFromMeasuredRect = useMainThreadRef(0)
  const autoScrollOverflow = useMainThreadRef(0)
  const autoScrollDirection = useMainThreadRef(0)
  const autoScrollStickyDirection = useMainThreadRef(0)
  const dragSourceHidden = useMainThreadRef(false)
  const activeItemRectRef = useMainThreadRef<SortableRect | null>(null)
  const activeRectMeasurementVersion = useMainThreadRef(0)
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
  const captureItemMeasuredScrollTop = useCallback(() => {
    'main thread'
    itemMeasuredScrollTop.current = scrollableScrollTopRef?.current ?? 0
  }, [itemMeasuredScrollTop, scrollableScrollTopRef])

  const measureRectById = useCallback((
    id: string | undefined,
    target: RectTarget,
  ) => {
    if (!id) {
      return
    }

    lynx.createSelectorQuery().select(`#${id}`)?.invoke({
      method: 'boundingClientRect',
      params: {},
      success: (res: unknown) => {
        const rect = res as SortableRect
        if (target === 'item') {
          setItemRect(rect)
          runOnMainThread(captureItemMeasuredScrollTop)()
          return
        }
        if (target === 'boundary') {
          setBoundaryRect(rect)
          return
        }

        setScrollableBoundaryRect(rect)
      },
    }).exec()
  }, [captureItemMeasuredScrollTop])

  const refreshDraggingRects = useCallback(() => {
    if (scrollableBoundaryRectRef) {
      return
    }
    measureRectById(itemElementId, 'item')
    measureRectById(boundaryId, 'boundary')
    measureRectById(scrollableBoundaryId, 'scrollableBoundary')
  }, [
    boundaryId,
    itemElementId,
    measureRectById,
    scrollableBoundaryId,
    scrollableBoundaryRectRef,
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

  const getCurrentItemRect = useCallback(() => {
    'main thread'
    return scrollableBoundaryRectRef
      ? activeItemRectRef.current
      : itemRect
  }, [activeItemRectRef, itemRect, scrollableBoundaryRectRef])

  const getCurrentScrollableBoundaryRect = useCallback(() => {
    'main thread'
    return scrollableBoundaryRectRef
      ? scrollableBoundaryRectRef.current
      : scrollableBoundaryRect
  }, [scrollableBoundaryRect, scrollableBoundaryRectRef])

  const getDragStartItemBounds = useCallback((translateY: number) => {
    'main thread'
    const currentItemRect = getCurrentItemRect()
    if (!currentItemRect) {
      return null
    }

    const measuredTopAtDragStart = currentItemRect.top
      - dragStartScrollDeltaFromMeasuredRect.current
    const measuredBottomAtDragStart = currentItemRect.bottom
      - dragStartScrollDeltaFromMeasuredRect.current

    return {
      top: measuredTopAtDragStart + translateY,
      bottom: measuredBottomAtDragStart + translateY,
    }
  }, [dragStartScrollDeltaFromMeasuredRect, getCurrentItemRect])

  const getAutoScrollOverflow = useCallback((
    distanceToTop: number,
    distanceToBottom: number,
  ) => {
    'main thread'
    return getAutoScrollTriggerOverflow(
      { distanceToTop, distanceToBottom },
      scrollableStickyUpperOffset,
      scrollableStickyLowerOffset,
    )
  }, [scrollableStickyLowerOffset, scrollableStickyUpperOffset])

  const getAutoScrollDirection = useCallback((
    overflowDirection: number,
    translateDeltaY: number,
  ) => {
    'main thread'
    if (translateDeltaY === 0) {
      return autoScrollDirection.current || overflowDirection
    }

    const dragDirection = translateDeltaY > 0 ? 1 : -1
    return dragDirection === overflowDirection ? overflowDirection : 0
  }, [autoScrollDirection])

  const getVisualTranslateY = useCallback(() => {
    'main thread'
    const scrollDelta = syncScrollDeltaForItemTranslateY()
    const currentItemRect = getCurrentItemRect()
    const currentScrollableBoundaryRect = getCurrentScrollableBoundaryRect()
    if (
      autoScrollStickyDirection.current > 0
      && currentItemRect
      && currentScrollableBoundaryRect
    ) {
      return currentScrollableBoundaryRect.bottom
        - currentItemRect.bottom
        - scrollableStickyLowerOffset
        + scrollDelta.measuredRectDeltaY
    }
    if (
      autoScrollStickyDirection.current < 0
      && currentItemRect
      && currentScrollableBoundaryRect
    ) {
      return currentScrollableBoundaryRect.top
        - currentItemRect.top
        + scrollableStickyUpperOffset
        + scrollDelta.measuredRectDeltaY
    }
    return latestDragTranslate.current.y + scrollDelta.dragDeltaY
  }, [
    autoScrollStickyDirection,
    getCurrentItemRect,
    getCurrentScrollableBoundaryRect,
    latestDragTranslate,
    scrollableStickyLowerOffset,
    scrollableStickyUpperOffset,
    syncScrollDeltaForItemTranslateY,
  ])

  const getVisualBounds = useCallback((visualTranslateY: number) => {
    'main thread'
    const currentItemRect = getCurrentItemRect()
    if (!currentItemRect) {
      return null
    }

    const scrollDelta = syncScrollDeltaForItemTranslateY()
    return {
      top: currentItemRect.top - scrollDelta.measuredRectDeltaY
        + visualTranslateY,
      left: currentItemRect.left + latestDragTranslate.current.x,
      width: currentItemRect.width,
      height: currentItemRect.height,
    }
  }, [
    getCurrentItemRect,
    latestDragTranslate,
    syncScrollDeltaForItemTranslateY,
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
    dirtyKeysRef.current[sortingKey] = true
  }, [
    MTSRef,
    dragSourceHidden,
    scrollableBoundaryId,
    dirtyKeysRef,
    sortingKey,
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
    const overlay = getDragOverlayElement()
    if (!overlay) {
      return
    }

    const bounds = getVisualBounds(visualTranslateY)
    if (!bounds) {
      return
    }
    overlay.setStyleProperty(
      'transform',
      `translate(${bounds.left}px, ${bounds.top}px)`,
    )
  }, [
    getDragOverlayElement,
    getVisualBounds,
  ])

  const tryActivateDragOverlay = useCallback(() => {
    'main thread'
    if (!scrollableBoundaryId || latestDragEvent.current === null) {
      return
    }

    const overlay = getDragOverlayElement()
    if (!overlay) {
      return
    }

    const visualTranslateY = getVisualTranslateY()
    const bounds = getVisualBounds(visualTranslateY)
    if (!bounds) {
      return
    }

    MTSRef.current?.MTSSetTransform(0, 0)
    hideDragSourceItem()
    overlay.setStyleProperties({
      position: 'fixed',
      top: '0px',
      left: '0px',
      width: `${bounds.width}px`,
      height: `${bounds.height}px`,
      opacity: '1',
      visibility: 'visible',
      'z-index': '10000',
      transform: `translate(${bounds.left}px, ${bounds.top}px)`,
    })
  }, [
    MTSRef,
    getDragOverlayElement,
    getVisualBounds,
    getVisualTranslateY,
    hideDragSourceItem,
    latestDragEvent,
    scrollableBoundaryId,
  ])

  const measureActiveItemAndTryOverlay = useCallback(() => {
    'main thread'
    if (!scrollableBoundaryRectRef || latestDragEvent.current === null) {
      return
    }

    const measurementVersion = activeRectMeasurementVersion.current + 1
    activeRectMeasurementVersion.current = measurementVersion
    activeItemRectRef.current = null
    const measurement = lynx.querySelector(`#${itemElementId}`)
      ?.invoke('boundingClientRect', {})
    void measurement?.then((value) => {
      'main thread'
      if (
        activeRectMeasurementVersion.current !== measurementVersion
        || latestDragEvent.current === null
      ) {
        return
      }

      activeItemRectRef.current = value as SortableRect
      itemMeasuredScrollTop.current = scrollableScrollTopRef?.current ?? 0

      const currentScrollableBoundaryRect = scrollableBoundaryRectRef.current
      const draggedItem = getDragStartItemBounds(
        latestDragTranslate.current.y,
      )
      if (
        currentScrollableBoundaryRect
        && currentScrollableBoundaryRect.height > 0
        && draggedItem
      ) {
        const { distanceToTop, distanceToBottom } = getEdgeDistance(
          draggedItem,
          currentScrollableBoundaryRect,
        )
        const overflow = getAutoScrollOverflow(
          distanceToTop,
          distanceToBottom,
        )
        if (overflow !== 0) {
          autoScrollStickyDirection.current = overflow > 0 ? 1 : -1
        }
      }

      tryActivateDragOverlay()
    })
  }, [
    activeItemRectRef,
    activeRectMeasurementVersion,
    autoScrollStickyDirection,
    getAutoScrollOverflow,
    getDragStartItemBounds,
    itemElementId,
    itemMeasuredScrollTop,
    latestDragEvent,
    latestDragTranslate,
    scrollableBoundaryRectRef,
    scrollableScrollTopRef,
    tryActivateDragOverlay,
  ])

  const applyVisualTranslate = useCallback(() => {
    'main thread'
    const visualTranslateY = getVisualTranslateY()
    if (scrollableBoundaryId) {
      if (dragSourceHidden.current && getDragOverlayElement()) {
        MTSRef.current?.MTSSetTransform(0, 0)
        updateDragOverlayTransform(visualTranslateY)
      } else {
        MTSRef.current?.MTSSetTransform(
          latestDragTranslate.current.x,
          visualTranslateY,
        )
      }
    } else {
      MTSRef.current?.MTSSetTransform(
        latestDragTranslate.current.x,
        visualTranslateY,
      )
    }
    dirtyKeysRef.current[sortingKey] = true
    return visualTranslateY
  }, [
    MTSRef,
    dragSourceHidden,
    getDragOverlayElement,
    getVisualTranslateY,
    latestDragTranslate,
    scrollableBoundaryId,
    updateDragOverlayTransform,
    dirtyKeysRef,
    sortingKey,
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
    if (!autoScrollingRef.current || latestDragEvent.current === null) {
      return
    }
    const visualTranslateY = applyVisualTranslate()

    emitSortableDragMove(visualTranslateY, latestDragEvent.current)
    scheduleNextAutoScrollFrame()
  }, [
    applyVisualTranslate,
    autoScrollingRef,
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
      const visualTranslateY = applyVisualTranslate()
      emitSortableDragMove(visualTranslateY, latestDragEvent.current)
      setAutoScrolling(false)
      return
    }

    const step = direction * Math.min(
      AUTO_SCROLL_MAX_STEP,
      Math.abs(overflow) * AUTO_SCROLL_VELOCITY_FACTOR,
    )
    const finishScrolledFrame = () => {
      'main thread'
      finishAutoScrollFrame()
    }

    scrollScrollableBoundaryBy(step, finishScrolledFrame)
  }, [
    applyVisualTranslate,
    autoScrollDirection,
    autoScrollOverflow,
    autoScrollingRef,
    emitSortableDragMove,
    finishAutoScrollFrame,
    isAutoScrollBlocked,
    latestDragEvent,
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

  const invalidateActiveItemMeasurement = useCallback(() => {
    'main thread'
    activeRectMeasurementVersion.current += 1
    activeItemRectRef.current = null
    latestDragEvent.current = null
    if (dragOverlayActivatorRefMap) {
      dragOverlayActivatorRefMap.current[sortingKey] = null
    }
  }, [
    activeItemRectRef,
    activeRectMeasurementVersion,
    dragOverlayActivatorRefMap,
    latestDragEvent,
    sortingKey,
  ])

  useEffect(() => {
    runOnMainThread(setChildrenMTSRef)(MTSRef, sortingKey)
    return () => {
      runOnMainThread(invalidateActiveItemMeasurement)()
    }
  }, [
    invalidateActiveItemMeasurement,
    refreshDraggingRects,
    scrollableBoundaryRectRef,
    setChildrenMTSRef,
    sortingKey,
  ])

  const syncDisabledKey = useCallback(
    (key: string, isDisabled: boolean) => {
      'main thread'
      if (isDisabled) {
        disabledKeysRef.current[key] = true
      } else {
        delete disabledKeysRef.current[key]
      }
    },
    [disabledKeysRef],
  )

  const handleMTSLayoutChange = useCallback(
    (e: MainThread.LayoutChangeEvent) => {
      'main thread'
      updateItemSize(sortingKey, e.detail.height)
    },
    [sortingKey, updateItemSize],
  )

  const resetAutoScrollDragState = useCallback(() => {
    'main thread'
    lastAutoScrollTranslateY.current = 0
    autoScrollDistanceSum.current = 0
    autoScrollCompensationY.current = 0
    autoScrollOverflow.current = 0
    autoScrollDirection.current = 0
    autoScrollStickyDirection.current = 0
    latestDragTranslate.current = { x: 0, y: 0 }
  }, [
    autoScrollCompensationY,
    autoScrollDirection,
    autoScrollDistanceSum,
    autoScrollOverflow,
    autoScrollStickyDirection,
    lastAutoScrollTranslateY,
    latestDragTranslate,
  ])

  const itemDragStart = useCallback((
    pagePoint: Point,
    event: MainThread.MouseEvent | MainThread.TouchEvent,
  ) => {
    'main thread'
    resetAutoScrollDragState()
    const scrollTop = scrollableScrollTopRef?.current ?? 0
    autoScrollStartScrollTop.current = scrollTop
    dragStartScrollDeltaFromMeasuredRect.current = scrollableBoundaryRectRef
      ? 0
      : scrollTop - itemMeasuredScrollTop.current
    latestDragEvent.current = event
    const currentScrollableBoundaryRect = getCurrentScrollableBoundaryRect()
    if (
      scrollableBoundaryId
      && currentScrollableBoundaryRect
      && currentScrollableBoundaryRect.height > 0
    ) {
      const draggedItem = getDragStartItemBounds(0)
      if (draggedItem) {
        const { distanceToTop, distanceToBottom } = getEdgeDistance(
          draggedItem,
          currentScrollableBoundaryRect,
        )
        const overflow = getAutoScrollOverflow(
          distanceToTop,
          distanceToBottom,
        )
        if (overflow !== 0) {
          autoScrollStickyDirection.current = overflow > 0 ? 1 : -1
        }
      }
    }
    if (dragOverlayActivatorRefMap) {
      dragOverlayActivatorRefMap.current[sortingKey] = tryActivateDragOverlay
    }
    if (scrollableBoundaryRectRef) {
      measureActiveItemAndTryOverlay()
    }
    handleDragStart?.(pagePoint, sortingKey, event)
    if (autoScrollStickyDirection.current !== 0) {
      const visualTranslateY = getVisualTranslateY()
      emitSortableDragMove(visualTranslateY, event)
    }
  }, [
    resetAutoScrollDragState,
    scrollableScrollTopRef,
    autoScrollStartScrollTop,
    dragStartScrollDeltaFromMeasuredRect,
    scrollableBoundaryRectRef,
    itemMeasuredScrollTop,
    latestDragEvent,
    getCurrentScrollableBoundaryRect,
    scrollableBoundaryId,
    getDragStartItemBounds,
    getAutoScrollOverflow,
    autoScrollStickyDirection,
    dragOverlayActivatorRefMap,
    sortingKey,
    tryActivateDragOverlay,
    measureActiveItemAndTryOverlay,
    handleDragStart,
    getVisualTranslateY,
    emitSortableDragMove,
  ])

  const itemDragging = useCallback((
    translate: Point,
    event: MainThread.MouseEvent | MainThread.TouchEvent,
  ) => {
    'main thread'
    latestDragTranslate.current = translate
    latestDragEvent.current = event
    const currentScrollableBoundaryRect = getCurrentScrollableBoundaryRect()
    if (
      scrollableBoundaryId
      && currentScrollableBoundaryRect
      && currentScrollableBoundaryRect.height > 0
    ) {
      const draggedItem = getDragStartItemBounds(translate.y)
      if (!draggedItem) {
        handleDragMove?.(translate, sortingKey, event)
        return
      }
      const { distanceToTop, distanceToBottom } = getEdgeDistance(
        draggedItem,
        currentScrollableBoundaryRect,
      )
      const translateDeltaY = translate.y - lastAutoScrollTranslateY.current
      const overflow = getAutoScrollOverflow(distanceToTop, distanceToBottom)

      lastAutoScrollTranslateY.current = translate.y

      if (overflow === 0) {
        stopAutoScrollLoop()
        const visualTranslateY = applyVisualTranslate()
        emitSortableDragMove(visualTranslateY, event)
      } else {
        const overflowDirection = overflow > 0 ? 1 : -1
        const scrollDirection = getAutoScrollDirection(
          overflowDirection,
          translateDeltaY,
        )
        autoScrollOverflow.current = overflow
        autoScrollStickyDirection.current = overflowDirection
        autoScrollDirection.current = scrollDirection
        const visualTranslateY = applyVisualTranslate()
        const blockedByScrollableEdge = scrollDirection !== 0
          && isAutoScrollBlocked(scrollDirection)
        if (scrollDirection === 0) {
          setAutoScrolling(false)
        } else if (blockedByScrollableEdge) {
          setAutoScrolling(false)
        } else {
          startAutoScrollLoop()
        }
        emitSortableDragMove(visualTranslateY, event)
      }
      return
    }

    handleDragMove?.(translate, sortingKey, event)
  }, [
    latestDragTranslate,
    latestDragEvent,
    getCurrentScrollableBoundaryRect,
    scrollableBoundaryId,
    getDragStartItemBounds,
    handleDragMove,
    sortingKey,
    lastAutoScrollTranslateY,
    getAutoScrollOverflow,
    stopAutoScrollLoop,
    applyVisualTranslate,
    emitSortableDragMove,
    getAutoScrollDirection,
    autoScrollOverflow,
    autoScrollStickyDirection,
    autoScrollDirection,
    isAutoScrollBlocked,
    setAutoScrolling,
    startAutoScrollLoop,
  ])

  const resetLocalDragVisuals = useCallback(() => {
    'main thread'
    if (!dirtyKeysRef.current[sortingKey]) {
      return
    }
    invalidateActiveItemMeasurement()
    stopAutoScrollLoop()
    MTSRef.current?.MTSSetTransform(0, 0)
    MTSRef.current?.MTSResetInternalTranslateValues()
    const overlayWasActive = dragSourceHidden.current
    showDragSourceItem()
    if (overlayWasActive) {
      const overlay = getDragOverlayElement()
      if (overlay) {
        overlay.setStyleProperties({
          opacity: '0',
          visibility: 'hidden',
          transform: 'translate(0px, 0px)',
        })
      }
    }
    delete dirtyKeysRef.current[sortingKey]
  }, [
    dirtyKeysRef,
    sortingKey,
    MTSRef,
    dragSourceHidden,
    showDragSourceItem,
    getDragOverlayElement,
    invalidateActiveItemMeasurement,
    stopAutoScrollLoop,
  ])

  const itemDragEnd = useCallback((
    _pagePoint: Point,
    event: MainThread.MouseEvent | MainThread.TouchEvent,
  ) => {
    'main thread'
    resetAutoScrollDragState()
    autoScrollStartScrollTop.current = 0
    dragStartScrollDeltaFromMeasuredRect.current = 0
    invalidateActiveItemMeasurement()
    stopAutoScrollLoop()
    const orderChanged = handleDragEnd?.(sortingKey, event) ?? false
    if (!orderChanged) {
      // no data update -> no precommit will run -> reset locally now
      resetLocalDragVisuals()
    }
    // The root clears dirty items in the same commit as the new order.
  }, [
    resetAutoScrollDragState,
    autoScrollStartScrollTop,
    dragStartScrollDeltaFromMeasuredRect,
    invalidateActiveItemMeasurement,
    stopAutoScrollLoop,
    handleDragEnd,
    sortingKey,
    resetLocalDragVisuals,
  ])

  usePreCommit(() => {
    'main thread'
    resetItemVisualsRef.current[sortingKey] = resetLocalDragVisuals
    syncDisabledKey(sortingKey, disabled)
  }, [
    resetItemVisualsRef,
    sortingKey,
    resetLocalDragVisuals,
    syncDisabledKey,
    disabled,
  ])

  const unregisterItem = useCallback(() => {
    'main thread'
    resetItemVisualsRef.current[sortingKey]?.()
    delete resetItemVisualsRef.current[sortingKey]
    delete dirtyKeysRef.current[sortingKey]
    delete disabledKeysRef.current[sortingKey]
    setChildrenMTSRef({ current: null }, sortingKey)
  }, [
    resetItemVisualsRef,
    dirtyKeysRef,
    disabledKeysRef,
    setChildrenMTSRef,
    sortingKey,
  ])
  useEffect(() => () => {
    runOnMainThread(unregisterItem)()
  }, [unregisterItem])

  const draggableProps = useMemo(() => ({
    'main-thread:bindlayoutchange': handleMTSLayoutChange,
  }), [handleMTSLayoutChange])
  const allowedDirection = useMemo(() => ['up', 'down'] as ['up', 'down'], [])
  const itemChildren = (
    <>
      {!scrollableBoundaryRectRef && (
        <SortableItemGeometryObserver refresh={refreshDraggingRects} />
      )}
      {children}
    </>
  )

  const itemDraggable = enableSorting && !disabled

  if (as === 'Draggable') {
    return (
      <Draggable
        id={itemElementId}
        MTSRef={MTSRef}
        trigger='immediate'
        className={className}
        enableDragging={itemDraggable}
        draggableProps={draggableProps}
        onMTSDragStart={itemDragStart}
        onMTSDragEnd={itemDragEnd}
        onMTSDragging={itemDragging}
        allowedDirection={allowedDirection}
        {...(!scrollableBoundaryId && boundaryId
          && {
            minTranslateY: -(itemRect.top - boundaryRect.top),
            maxTranslateY: boundaryRect.bottom
              - itemRect.bottom,
          })}
      >
        {itemChildren}
      </Draggable>
    )
  } else {
    return (
      <DraggableRoot
        id={itemElementId}
        MTSRef={MTSRef}
        trigger='immediate'
        className={className}
        draggableProps={draggableProps}
        onMTSDragStart={itemDragStart}
        onMTSDragEnd={itemDragEnd}
        onMTSDragging={itemDragging}
        enableDragging={itemDraggable}
        {...(!scrollableBoundaryId && boundaryId
          && {
            minTranslateY: -(itemRect.top - boundaryRect.top),
            maxTranslateY: boundaryRect.bottom
              - itemRect.bottom,
          })}
        allowedDirection={allowedDirection}
      >
        {itemChildren}
      </DraggableRoot>
    )
  }
}
