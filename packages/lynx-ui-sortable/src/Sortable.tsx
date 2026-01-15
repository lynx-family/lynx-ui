// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import {
  runOnMainThread,
  useCallback,
  useContext,
  useEffect,
  useMainThreadRef,
  useMemo,
  useRef,
  useState,
} from '@lynx-js/react'
import type { RefObject } from '@lynx-js/react'

import type { Point } from '@lynx-js/lynx-ui-common'
import {
  Draggable,
  DraggableArea,
  DraggableRoot,
} from '@lynx-js/lynx-ui-draggable'
import type { DraggableRef } from '@lynx-js/lynx-ui-draggable'
import type { MainThread, NodesRef } from '@lynx-js/types'

import { SortableContext } from './SortableContext'
import type {
  SortableData,
  SortableItemProps,
  SortableRootProps,
} from './types'
import { useSortable } from './useSortable'

export { DraggableArea as SortableItemArea }

export function SortableRoot<T>(props: SortableRootProps<T>) {
  const {
    children,
    data,
    debugLog = false,
    boundaryId,
    onSortEnd,
    onSortStart,
    enableSorting = true,
  } = props
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
  const updateItemSize = useCallback((sortingKey: string, size: number) => {
    'main thread'
    sizeMap.current[sortingKey] = size
  }, [])

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

  const { handleDragEnd, handleDragMove, handleDragStart } = useSortable({
    data: data as SortableData<unknown>[],
    sizeMap: sizeMap,
    itemRefMap: childrenRefMap,
    itemMTSRefMap: childrenMTSRefMap,
    onDragEnd: onSortEnd as (sortedData: SortableData<unknown>[]) => void,
    onDragStart: onSortStart,
    debugLog,
  })
  const sortableContextValue = useMemo(() => ({
    data,
    enableSorting,
    boundaryId,
    updateItemSize,
    setChildrenRef,
    setChildrenMTSRef,
    handleDragEnd,
    handleDragMove,
    handleDragStart,
  }), [
    data,
    enableSorting,
    boundaryId,
    updateItemSize,
    setChildrenRef,
    setChildrenMTSRef,
    handleDragEnd,
    handleDragMove,
    handleDragStart,
  ])

  const renderedChildren = useMemo(
    () => data?.map(item => children(item)),
    [data, children],
  )

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
  const { className, children, sortingKey, as = 'Draggable' } = props
  const {
    data,
    enableSorting,
    boundaryId,
    updateItemSize,
    setChildrenRef,
    setChildrenMTSRef,
    handleDragStart,
    handleDragEnd,
    handleDragMove,
  } = useContext(SortableContext)

  const MTSRef = useMainThreadRef<DraggableRef>(null)
  const ref = useRef<NodesRef>(null)
  const [itemRect, setItemRect] = useState<boundingClientRectRes>({
    height: 0,
    width: 0,
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  })
  const [boundaryRect, setBoundaryRect] = useState<boundingClientRectRes>({
    height: 0,
    width: 0,
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  })
  useEffect(() => {
    runOnMainThread(setChildrenMTSRef)(MTSRef, sortingKey)
    if (boundaryId) {
      ref?.current
        ?.invoke({
          method: 'boundingClientRect',
          params: {},
          success: (res) => {
            setItemRect(res as boundingClientRectRes)
          },
        })
        .exec()
      lynx.createSelectorQuery().select(`#${boundaryId}`)?.invoke({
        method: 'boundingClientRect',
        params: {},
        success: (res) => {
          setBoundaryRect(res as boundingClientRectRes)
        },
      })
        .exec()
    }
  }, [setChildrenRef, setChildrenMTSRef, sortingKey, data, boundaryId])

  const handleMTSLayoutChange = (e: MainThread.LayoutChangeEvent) => {
    'main thread'
    updateItemSize(sortingKey, e.detail.height)
  }

  const itemDragStart = (
    pagePoint: Point,
    event: MainThread.MouseEvent | MainThread.TouchEvent,
  ) => {
    'main thread'
    handleDragStart?.(pagePoint, sortingKey, event)
  }

  const itemDragging = (
    translate: Point,
    event: MainThread.MouseEvent | MainThread.TouchEvent,
  ) => {
    'main thread'
    handleDragMove?.(translate, sortingKey, event)
  }

  const itemDragEnd = (
    _pagePoint: Point,
    event: MainThread.MouseEvent | MainThread.TouchEvent,
  ) => {
    'main thread'
    handleDragEnd?.(sortingKey, event)
  }

  const resetStyle = useMemo(
    () => ({ transform: 'translate(0, 0)', zIndex: '0' }),
    [data],
  )

  if (as === 'Draggable') {
    return (
      <Draggable
        MTSRef={MTSRef}
        ref={ref}
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
        {...(boundaryId
          && {
            minTranslateY: -(itemRect?.top - boundaryRect?.top),
            maxTranslateY: boundaryRect?.bottom - itemRect?.bottom,
          })}
      >
        {children}
      </Draggable>
    )
  } else {
    return (
      <DraggableRoot
        MTSRef={MTSRef}
        ref={ref}
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
        {...(boundaryId
          && {
            minTranslateY: -(itemRect?.top - boundaryRect?.top),
            maxTranslateY: boundaryRect?.bottom - itemRect?.bottom,
          })}
        allowedDirection={['up', 'down']}
      >
        {children}
      </DraggableRoot>
    )
  }
}
