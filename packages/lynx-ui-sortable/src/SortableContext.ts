// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { createContext } from '@lynx-js/react'
import type { MutableRefObject, RefObject } from '@lynx-js/react'

import { noop } from '@lynx-js/lynx-ui-common'
import type { Point } from '@lynx-js/lynx-ui-common'
import type { DraggableRef } from '@lynx-js/lynx-ui-draggable'
import type { MainThread } from '@lynx-js/types'

export interface SortableRect {
  height: number
  width: number
  top: number
  left: number
  bottom: number
  right: number
}

export interface SortableContextType {
  isDragOverlay: boolean
  resetItemVisualsRef: MutableRefObject<
    Record<string, (() => void) | undefined>
  >
  boundaryId?: string
  scrollableBoundaryId?: string
  scrollableBoundaryUpperEdgeRef?: MutableRefObject<boolean>
  scrollableBoundaryLowerEdgeRef?: MutableRefObject<boolean>
  scrollableBoundaryRectRef?: MutableRefObject<SortableRect | null>
  scrollableScrollTopRef?: MutableRefObject<number>
  dragOverlayRefMap?: MutableRefObject<
    Record<string, MainThread.Element | null>
  >
  dragOverlayActivatorRefMap?: MutableRefObject<
    Record<string, (() => void) | null>
  >
  dirtyKeysRef: MutableRefObject<Record<string, boolean>>
  disabledKeysRef: MutableRefObject<Record<string, boolean>>
  scrollableStickyUpperOffset: number
  scrollableStickyLowerOffset: number
  debugLog: boolean
  enableSorting: boolean
  updateItemSize: (sortingKey: string, size: number) => void
  setChildrenRef: (refI: RefObject<DraggableRef>, key: string) => void
  setChildrenMTSRef: (
    refI: RefObject<DraggableRef>,
    key: string,
  ) => void
  setDragOverlayRef: (
    refI: RefObject<MainThread.Element | null>,
    key: string,
  ) => void
  clearDragOverlayRef: (key: string) => void
  handleDragStart: (
    pagePoint: Point,
    sortingKey: string,
    event: MainThread.MouseEvent | MainThread.TouchEvent,
  ) => void
  handleDragMove: (
    delta: Point,
    sortingKey: string,
    event: MainThread.MouseEvent | MainThread.TouchEvent,
  ) => void
  handleDragEnd: (
    sortingKey: string,
    event: MainThread.MouseEvent | MainThread.TouchEvent,
  ) => boolean
}

// Only legacy geometry observers subscribe to ordering, not gesture owners.
export const SortableOrderContext = createContext('[]')

export const SortableContext = createContext<SortableContextType>({
  isDragOverlay: false,
  debugLog: false,
  resetItemVisualsRef: { current: {} },
  enableSorting: true,
  scrollableStickyUpperOffset: 0,
  scrollableStickyLowerOffset: 0,
  dirtyKeysRef: { current: {} },
  disabledKeysRef: { current: {} },
  updateItemSize: noop,
  setChildrenRef: noop,
  setChildrenMTSRef: noop,
  setDragOverlayRef: noop,
  clearDragOverlayRef: noop,
  handleDragStart: noop,
  handleDragMove: noop,
  handleDragEnd: () => false,
})
