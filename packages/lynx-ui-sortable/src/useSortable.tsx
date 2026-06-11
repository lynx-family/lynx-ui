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

interface SortableOptionsType<T> {
  data: SortableData<T>[] // sorting key array
  sizeMap: MainThreadRef<Record<string, number>> // sorting key -> size
  itemRefMap: RefObject<Record<string, DraggableRef | null>>
  itemMTSRefMap: MainThreadRef<Record<string, DraggableRef | null>> // sortingKey -> element Ref
  dirtyKeysRef: MainThreadRef<Record<string, boolean>>
  disabledKeysRef: MainThreadRef<Record<string, boolean>>
  onDragEnd?: (sortedKeyArray: SortableData<T>[]) => void
  onDragStart?: () => void
  debugLog?: boolean
}

export function useSortable<T>(
  useSortableOptions: SortableOptionsType<T>,
) {
  const {
    data,
    sizeMap,
    itemMTSRefMap,
    dirtyKeysRef,
    disabledKeysRef,
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
  const lastCrossedDisabledSize = useMainThreadRef<number>(0)
  const changedKey = useMainThreadRef<string[]>([]) // Store all the moved item. Remember to reset them
  const lastSwappedKey = useMainThreadRef<string>('') // Store the last swapped item. Use it to do the sorting.

  const changeItemZIndex = useCallback((zIndex: number, sortingKey: string) => {
    'main thread'
    const item = itemMTSRefMap.current[sortingKey]

    item?.MTSSetOtherStyles({
      'z-index': `${zIndex}`,
    })
    dirtyKeysRef.current[sortingKey] = true
  }, [itemMTSRefMap, dirtyKeysRef])

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
  ) => { index: number, distance: number, crossedDisabledSize: number } =
    useCallback(
      (movingDistance, sortingKey) => {
        'main thread'
        const index = keyArray.indexOf(sortingKey)
        if (keyArray.length === 0 || index < 0 || index >= keyArray.length) {
          mtsLog(debugLog, '[swappingIndexAndDistance] invalid index', index)
          return { index: -1, distance: 0, crossedDisabledSize: 0 }
        }

        const absDistance = Math.abs(movingDistance)
        const direction = movingDistance > 0 ? 1 : -1
        let currentIndex = index + direction
        let accumulatedDistance = 0
        // The total size of the contiguous disabled (locked) items immediately
        // preceding the current candidate movable, i.e. the disabled gap
        // between the previous movable neighbor (or the drag start) and the
        // movable we are about to evaluate. Every time we pass a movable
        // without picking it as the swap target, this gap resets to 0, so
        // each potential swap target only sees the locked items strictly
        // between it and its previous movable neighbor — never a cumulative
        // total from the drag origin.
        let disabledGap = 0
        while (true) {
          if (currentIndex < 0 || currentIndex >= keyArray.length) {
            return {
              index: -1,
              distance: (movingDistance > 0 ? 1 : -1)
                * (absDistance - accumulatedDistance),
              crossedDisabledSize: disabledGap,
            }
          }
          const currentKey = keyArray[currentIndex]
          // Disabled (locked) items are never picked as a swap candidate and
          // never displaced. The dragged item is allowed to cross over them by
          // skipping past while still consuming their height, so the dragged
          // item's physical displacement keeps in sync with `accumulatedDistance`
          // and the disabled item's absolute position is preserved.
          if (disabledKeysRef.current[currentKey]) {
            const disabledSize = sizeMap.current[currentKey]
            if (typeof disabledSize !== 'number') {
              mtsLog(
                debugLog,
                `[swappingIndexAndDistance] disabled item size not found for key ${currentKey}, stopping at index ${currentIndex}.`,
              )
              return {
                index: -1,
                distance: (movingDistance > 0 ? 1 : -1) * accumulatedDistance,
                crossedDisabledSize: disabledGap,
              }
            }
            // The dragged item is still physically over this disabled item,
            // so no swap target should be produced yet.
            if (accumulatedDistance + disabledSize >= absDistance) {
              mtsLog(
                debugLog,
                `[swappingIndexAndDistance] still over disabled item ${currentKey} at index ${currentIndex}.`,
              )
              return {
                index: -1,
                distance: (movingDistance > 0 ? 1 : -1) * accumulatedDistance,
                crossedDisabledSize: disabledGap,
              }
            }
            mtsLog(
              debugLog,
              `[swappingIndexAndDistance] cross disabled item ${currentKey} at index ${currentIndex}.`,
            )
            accumulatedDistance += disabledSize
            disabledGap += disabledSize
            currentIndex += direction
            continue
          }
          const size = sizeMap.current[currentKey]
          if (typeof size !== 'number') {
            mtsLog(
              debugLog,
              `[swappingIndexAndDistance] item size not found for key ${sortingKey}, stopping at index ${currentIndex}.`,
            )
            return {
              index: -1,
              distance: (movingDistance > 0 ? 1 : -1) * accumulatedDistance,
              crossedDisabledSize: disabledGap,
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
              // Only the disabled items strictly between the previous movable
              // neighbor and this swap target. Locked items further back have
              // already been accounted for when their own following movable
              // became (and was clamped as) a swap target.
              crossedDisabledSize: disabledGap,
            }
          }
          // We just passed this movable without choosing it as the swap target,
          // so the disabled gap "in front of" the next candidate restarts here.
          disabledGap = 0
          currentIndex += direction
        }
      },
      [keyArray, sizeMap, disabledKeysRef],
    )

  const setTransform = useCallback(
    (key: string, translate: number) => {
      'main thread'

      const item = key ? itemMTSRefMap.current[key] : null
      item?.MTSSetTransform(0, translate)
      if (key) {
        dirtyKeysRef.current[key] = true
      }
    },
    [itemMTSRefMap, dirtyKeysRef],
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
      const lastSwappingItemKey = lastSwappingKey.current
      if (
        Math.abs(swappingItemTranslation.current)
          > draggingItemSize * swapConfirmedPercentage.current
      ) {
        // The previous swap target's "swapped" position must include the
        // height of any disabled items the dragged item had crossed over to
        // reach it; otherwise it would visually overlap with the (still
        // in-place) disabled items after we leave it behind.
        setTransform(
          lastSwappingItemKey,
          (movingDistance < 0 ? 1 : -1)
            * (draggingItemSize + lastCrossedDisabledSize.current),
        )
      } else {
        setTransform(lastSwappingItemKey, 0)
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
      const {
        index: swappingIndex,
        distance: consumedDistance,
        crossedDisabledSize = 0,
      } = swappingIndexAndDistance(movingDistance, sortingKey)
      mtsLog(
        debugLog,
        'swappingIndexAndDistance',
        swappingIndex,
        consumedDistance,
        crossedDisabledSize,
      )
      if (swappingIndex < 0) {
        clampPreviousItem(consumedDistance, sortingKey)
        return
      }
      const swappingKey = keyArray[swappingIndex]

      if (swappingKey !== lastSwappingKey.current) {
        updateLastSwappingItem(movingDistance, sortingKey, swappingKey)
        changedKey.current.push(swappingKey)
      }

      const unconsumedDistance = movingDistance - consumedDistance
      updateConfirmedInteractedID(unconsumedDistance, sortingKey)
      // When the dragged item has crossed over disabled items, those items do
      // not translate. To avoid the swap target jumping, scale its translate
      // proportionally as the dragged item progresses over it: while the
      // dragged item moves `swappingItemSize` over the swap target, the swap
      // target translates `swappingItemSize + crossedDisabledSize`, ending
      // exactly at the dragged item's original slot without any jump.
      const swappingItemSize = sizeMap.current[swappingKey] ?? 0
      const speedMultiplier = swappingItemSize > 0
        ? (swappingItemSize + crossedDisabledSize) / swappingItemSize
        : 1
      setTransform(swappingKey, -unconsumedDistance * speedMultiplier)
      lastCrossedDisabledSize.current = crossedDisabledSize
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
      changeItemZIndex(10000, sortingKey)
      mtsLog(debugLog, '[event drag move]', event)
    },
    [switchHandler, changeItemZIndex],
  )

  const sortArray = useCallback((sortingKey: string) => {
    'main thread'
    const draggingIndex = keyArray.indexOf(sortingKey)
    const swappedIndex = keyArray.indexOf(lastSwappedKey.current)

    mtsLog(debugLog, 'sortArray with lastSwappedKey ', lastSwappedKey.current)

    if (
      draggingIndex === -1 || swappedIndex === -1
      || draggingIndex === swappedIndex
    ) {
      return [...keyArray]
    }

    // Disabled items must keep their absolute positions in the result. We
    // splice only the movable (non-disabled) sequence and then reinsert
    // disabled items at their original indices.
    const disabledIndices: Record<number, string> = {}
    const movableKeys: string[] = []
    for (let i = 0; i < keyArray.length; i++) {
      const k = keyArray[i]
      if (disabledKeysRef.current[k]) {
        disabledIndices[i] = k
      } else {
        movableKeys.push(k)
      }
    }
    const movableDraggingIdx = movableKeys.indexOf(sortingKey)
    const movableSwappedIdx = movableKeys.indexOf(lastSwappedKey.current)
    if (movableDraggingIdx === -1 || movableSwappedIdx === -1) {
      return [...keyArray]
    }
    const [draggedItem] = movableKeys.splice(movableDraggingIdx, 1)
    movableKeys.splice(movableSwappedIdx, 0, draggedItem)
    const result: string[] = []
    let cursor = 0
    for (let i = 0; i < keyArray.length; i++) {
      if (disabledIndices[i] === undefined) {
        result.push(movableKeys[cursor])
        cursor++
      } else {
        result.push(disabledIndices[i])
      }
    }
    return result
  }, [keyArray, lastSwappedKey, disabledKeysRef])

  const resetSwapTrackingRefs = useCallback(() => {
    'main thread'
    lastSwappedKey.current = ''
    lastSwappingKey.current = ''
    swappingItemTranslation.current = 0
    lastCrossedDisabledSize.current = 0
    changedKey.current = []
  }, [
    changedKey,
    lastSwappedKey,
    lastSwappingKey,
    swappingItemTranslation,
    lastCrossedDisabledSize,
  ])

  const resetStatus = useCallback((draggingKey?: string) => {
    'main thread'
    changedKey.current.map((key: string) => {
      if (key === draggingKey) {
        return
      }
      const item = itemMTSRefMap?.current?.[key]
      if (!item) {
        return
      }
      if (typeof item.MTSSetTransform === 'function') {
        item.MTSSetTransform(0, 0)
      }
      if (typeof item.MTSResetInternalTranslateValues === 'function') {
        item.MTSResetInternalTranslateValues()
      }
    })
    resetSwapTrackingRefs()
  }, [changedKey, itemMTSRefMap, resetSwapTrackingRefs])

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
    ): boolean => {
      'main thread'
      mtsLog(debugLog, '[event drag end]', event)
      const sortedKey = sortArray(sortingKey)
      let orderChanged = sortedKey.length !== keyArray.length
      if (!orderChanged) {
        for (let i = 0; i < sortedKey.length; i++) {
          if (sortedKey[i] !== keyArray[i]) {
            orderChanged = true
            break
          }
        }
      }
      if (orderChanged) {
        // data will be updated by consumer -> usePreCommit will reset dirty items
        runOnBackground(rootDragEnd)(sortedKey)
        // dom transforms are reset by usePreCommit, but swap tracking refs
        // must be cleared synchronously to avoid stale state on next drag
        resetSwapTrackingRefs()
      } else {
        // no data update -> no precommit -> reset dirty items synchronously here
        resetStatus(sortingKey)
        runOnBackground(rootDragEnd)(sortedKey)
      }
      return orderChanged
    },
    [keyArray, resetStatus, resetSwapTrackingRefs, rootDragEnd, sortArray],
  )

  return {
    handleDragStart,
    handleDragMove,
    handleDragEnd,
  }
}
