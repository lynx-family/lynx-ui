// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import {
  runOnBackground,
  useCallback,
  useMainThreadRef,
  useMemo,
} from '@lynx-js/react'
import type { MainThreadRef, RefObject } from '@lynx-js/react'

import { mtsLog } from '@lynx-js/lynx-ui-common'
import type { Point } from '@lynx-js/lynx-ui-common'
import type { DraggableRef } from '@lynx-js/lynx-ui-draggable'
import type { MainThread } from '@lynx-js/types'

import type { SortableData } from './types'

interface SortableOptionsType {
  data: SortableData<unknown>[] // sorting key array
  sizeMap: MainThreadRef<Record<string, number>> // sorting key -> size
  itemRefMap: RefObject<Record<string, DraggableRef | null>>
  itemMTSRefMap: MainThreadRef<Record<string, DraggableRef | null>> // sortingKey -> element Ref
  onDragEnd?: (sortedKeyArray: SortableData<unknown>[]) => void
  onDragStart?: () => void
  debugLog?: boolean
}

export function useSortable(
  useSortableOptions: SortableOptionsType,
) {
  const {
    data,
    sizeMap,
    itemMTSRefMap,
    onDragEnd,
    onDragStart,
    debugLog = false,
  } = useSortableOptions

  const safeData = Array.isArray(data) ? data : []
  const keyArray = useMemo(() => safeData.map(item => item.getSortingKey()), [
    safeData,
  ])
  const swapConfirmedPercentage = useMainThreadRef<number>(0.5)
  const touchStartPoint = useMainThreadRef<Point>({ x: 0, y: 0 })
  const lastSwappingKey = useMainThreadRef<string>('')
  const swappingItemTranslation = useMainThreadRef<number>(0)
  const changedKey = useMainThreadRef<string[]>([]) // Store all the moved item. Remember to reset them
  const lastSwappedKey = useMainThreadRef<string>('') // Store the last swapped item. Use it to do the sorting.

  const changeItemZIndex = useCallback((zIndex: number, sortingKey: string) => {
    'main thread'
    const item = itemMTSRefMap.current[sortingKey]

    item?.MTSSetOtherStyles({
      'transform': `translateZ(${zIndex}px)`,
      'z-index': `${zIndex}`,
    })
  }, [itemMTSRefMap])

  const handleDragStartJS = useCallback(() => {
    onDragStart?.()
  }, [onDragStart])

  const handleDragStart = useCallback(
    (
      pagePoint: Point,
      sortingKey: string,
      event: MainThread.MouseEvent | MainThread.TouchEvent,
    ) => {
      'main thread'
      runOnBackground(handleDragStartJS)()
      touchStartPoint.current = pagePoint
      changedKey.current.push(sortingKey)
      changeItemZIndex(10000, sortingKey)
      mtsLog(debugLog, '[event drag start]', event)
    },
    [handleDragStartJS, touchStartPoint, changedKey, changeItemZIndex],
  )

  const swappingIndexAndDistance: (
    movingDistance: number,
    sortingKey: string,
  ) => { index: number, distance: number } = useCallback(
    (movingDistance, sortingKey) => {
      'main thread'
      const index = keyArray.indexOf(sortingKey)
      if (keyArray.length === 0 || index < 0 || index >= keyArray.length) {
        mtsLog(debugLog, '[swappingIndexAndDistance] invalid index', index)
        return { index: -1, distance: 0 }
      }

      const absDistance = Math.abs(movingDistance)
      const direction = movingDistance > 0 ? 1 : -1
      let currentIndex = index + direction
      let accumulatedDistance = 0
      while (true) {
        if (currentIndex < 0 || currentIndex >= keyArray.length) {
          return {
            index: -1,
            distance: (movingDistance > 0 ? 1 : -1)
              * (absDistance - accumulatedDistance),
          }
        }
        const size = sizeMap.current[keyArray[currentIndex]]
        if (typeof size !== 'number') {
          mtsLog(
            debugLog,
            `[swappingIndexAndDistance] item size not found for key ${sortingKey}, stopping at index ${currentIndex}.`,
          )
          return {
            index: -1,
            distance: (movingDistance > 0 ? 1 : -1) * accumulatedDistance,
          }
        }
        accumulatedDistance += size

        if (accumulatedDistance >= absDistance) {
          return {
            index: currentIndex,
            // This distance is the remained dragging distance needs to be consumed by current interacting item.
            // E.g.: the total delta is 458 and all item is all 100px tall. Then the first 400 will be consumed the previous clamped items. And the 58 is current interacting item.
            distance: (movingDistance > 0 ? 1 : -1)
              * (accumulatedDistance - size),
          }
        }
        currentIndex += direction
      }
    },
    [keyArray, sizeMap],
  )

  const setTransform = useCallback(
    (item: DraggableRef | null, translate: number) => {
      'main thread'

      item?.MTSSetOtherStyles({ 'transform': `translateY(${translate}px)` })
    },
    [],
  )

  // Clamp the previous interacting item to the grid
  const clampPreviousItem = (movingDistance: number, sortingKey: string) => {
    'main thread'
    mtsLog(
      debugLog,
      `clamp ${lastSwappingKey.current} to grid`,
    )
    const draggingItemSize = sizeMap.current[sortingKey]
    if (lastSwappingKey.current !== null) {
      const lastSwappingItem = lastSwappingKey.current
        ? itemMTSRefMap.current[lastSwappingKey.current]
        : null
      if (
        Math.abs(swappingItemTranslation.current)
          > draggingItemSize * swapConfirmedPercentage.current
      ) {
        setTransform(
          lastSwappingItem,
          (movingDistance < 0 ? 1 : -1) * draggingItemSize,
        )
      } else {
        setTransform(lastSwappingItem, 0)
      }
    }
  }

  const updateLastSwappingItem = (
    movingDistance: number,
    sortingKey: string,
    swappingKey: string,
  ) => {
    'main thread'
    mtsLog(
      debugLog,
      `interact item from ${lastSwappingKey.current} to ${swappingKey}`,
    )
    clampPreviousItem(movingDistance, sortingKey)
    lastSwappingKey.current = swappingKey
  }

  // Update the confirmed interacting ID if the condition is met
  const updateConfirmedInteractedID = (
    unconsumedDistance: number,
    sortingKey: string,
  ) => {
    'main thread'
    mtsLog(
      debugLog,
      `swapping with ${lastSwappingKey.current} at ${unconsumedDistance}`,
    )
    const draggingItemSize = sizeMap.current[sortingKey]
    if (
      Math.abs(unconsumedDistance)
        > draggingItemSize * swapConfirmedPercentage.current
    ) {
      lastSwappedKey.current = lastSwappingKey.current
      mtsLog(
        debugLog,
        `confirmed swapping with ${lastSwappedKey.current} at cross ${unconsumedDistance}`,
      )
    } else if (lastSwappedKey.current === lastSwappingKey.current) {
      // Handle case when dragging back over a previously swapped item
      const swappingIndex = keyArray.indexOf(lastSwappingKey.current)
      const draggedItemIndex = keyArray.indexOf(sortingKey)

      // Get new swap candidate index based on drag direction reversal
      // Drag down → reverse up: `swappingIndex - 1`
      // Drag up → reverse down: `swappingIndex + 1`
      const indexModifier = swappingIndex > draggedItemIndex ? -1 : 1
      const newSwappedKeyIndex = swappingIndex + indexModifier

      // The logic should prevent out-of-bounds access, but as a safeguard:
      if (newSwappedKeyIndex >= 0 && newSwappedKeyIndex < keyArray.length) {
        const newSwappedKey = keyArray[newSwappedKeyIndex]

        // If new candidate's index matches dragged item's index, item returned to original position; no swap confirmed.
        if (newSwappedKeyIndex === draggedItemIndex) {
          lastSwappedKey.current = ''
        } else {
          lastSwappedKey.current = newSwappedKey
        }
      } else {
        // Item is returning to original position when reverting swap at list start/end.
        lastSwappedKey.current = ''
      }

      mtsLog(
        debugLog,
        `Reverted swap with ${lastSwappingKey.current}. New confirmed swap is with ${
          lastSwappedKey.current || 'none'
        }.`,
      )
    }
    swappingItemTranslation.current = unconsumedDistance
  }

  const switchHandler = useCallback(
    (movingDistance: number, sortingKey: string) => {
      'main thread'
      const { index: swappingIndex, distance: consumedDistance } =
        swappingIndexAndDistance(movingDistance, sortingKey)
      mtsLog(
        debugLog,
        'swappingIndexAndDistance',
        swappingIndex,
        consumedDistance,
      )
      if (swappingIndex < 0) {
        clampPreviousItem(consumedDistance, sortingKey)
        return
      }
      const swappingKey = keyArray[swappingIndex]
      const swappingItem = itemMTSRefMap.current[swappingKey]

      if (swappingKey !== lastSwappingKey.current) {
        updateLastSwappingItem(movingDistance, sortingKey, swappingKey)
        changedKey.current.push(swappingKey)
      }

      const unconsumedDistance = movingDistance - consumedDistance
      updateConfirmedInteractedID(unconsumedDistance, sortingKey)
      setTransform(swappingItem, -unconsumedDistance)
    },
    [
      changedKey,
      itemMTSRefMap,
      keyArray,
      lastSwappingKey,
      setTransform,
      swappingIndexAndDistance,
      updateConfirmedInteractedID,
      updateLastSwappingItem,
    ],
  )

  const handleDragMove = useCallback(
    (
      delta: Point,
      sortingKey: string,
      event: MainThread.MouseEvent | MainThread.TouchEvent,
    ) => {
      'main thread'
      switchHandler(delta.y, sortingKey)
      mtsLog(debugLog, '[event drag move]', event)
    },
    [switchHandler],
  )

  const sortArray = useCallback((sortingKey: string) => {
    'main thread'
    const draggingIndex = keyArray.indexOf(sortingKey)
    const swappedIndex = keyArray.indexOf(lastSwappedKey.current)
    const swappedKeyArray = [...keyArray]

    mtsLog(debugLog, 'sortArray with lastSwappedKey ', lastSwappedKey.current)

    if (
      draggingIndex === -1 || swappedIndex === -1
      || draggingIndex === swappedIndex
    ) {
      return swappedKeyArray
    }

    const [draggedItem] = swappedKeyArray.splice(draggingIndex, 1)
    swappedKeyArray.splice(swappedIndex, 0, draggedItem)
    return swappedKeyArray
  }, [keyArray, lastSwappedKey])

  const resetStatus = useCallback(() => {
    'main thread'
    changedKey.current.map((key: string) => {
      const item = itemMTSRefMap?.current?.[key]
      if (item && typeof item.MTSResetInternalTranslateValues === 'function') {
        item?.MTSResetInternalTranslateValues()
      }
    })
    lastSwappedKey.current = ''
    lastSwappingKey.current = ''
    changedKey.current = []
  }, [changedKey, itemMTSRefMap, lastSwappedKey, lastSwappingKey])

  const rootDragEnd = useCallback((sortedKey: string[]) => {
    const keyToItemMap = new Map(data.map((item, index) => {
      return [keyArray[index], item]
    }))
    const sortedData = sortedKey
      .map(key => keyToItemMap.get(key))
      .filter((item): item is NonNullable<typeof item> => !!item)
    onDragEnd?.(sortedData)
  }, [data, keyArray, onDragEnd])

  const handleDragEnd = useCallback(
    (
      sortingKey: string,
      event: MainThread.MouseEvent | MainThread.TouchEvent,
    ) => {
      'main thread'
      mtsLog(debugLog, '[event drag end]', event)
      const sortedKey = sortArray(sortingKey)
      runOnBackground(rootDragEnd)(sortedKey)
      resetStatus()
    },
    [resetStatus, rootDragEnd, sortArray],
  )

  return {
    handleDragStart,
    handleDragMove,
    handleDragEnd,
  }
}
