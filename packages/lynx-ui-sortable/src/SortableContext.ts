// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { createContext } from '@lynx-js/react'
import type { RefObject } from '@lynx-js/react'

import { noop } from '@lynx-js/lynx-ui-common'
import type { Point } from '@lynx-js/lynx-ui-common'
import type { DraggableRef } from '@lynx-js/lynx-ui-draggable'
import type { MainThread } from '@lynx-js/types'

import type { SortableData } from './types'

interface SortableContextType<T = unknown> {
  data: SortableData<T>[]
  boundaryId?: string
  enableSorting: boolean
  updateItemSize: (sortingKey: string, size: number) => void
  setChildrenRef: (refI: RefObject<DraggableRef>, key: string) => void
  setChildrenMTSRef: (
    refI: RefObject<DraggableRef>,
    key: string,
  ) => void
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
  ) => void
}

export const SortableContext = createContext<SortableContextType>({
  data: [],
  enableSorting: true,
  updateItemSize: noop,
  setChildrenRef: noop,
  setChildrenMTSRef: noop,
  handleDragStart: noop,
  handleDragMove: noop,
  handleDragEnd: noop,
})
