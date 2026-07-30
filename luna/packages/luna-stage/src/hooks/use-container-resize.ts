// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { useRef, useState } from 'react'
import type { RefObject } from 'react'

import { useEventCallback } from './use-event-callback'
import { useIsomorphicLayoutEffect } from './use-isomorphic-layout-effect'

interface Size {
  width?: number
  height?: number
}

/** Constructor type for ResizeObserver */
type ResizeObserverCtor = new(
  callback: ResizeObserverCallback,
) => ResizeObserver

interface UseContainerResizeOptions<T> {
  /** The ref of the element to observe. */
  ref: RefObject<T | null>
  /**
   * Optional: inject a polyfill constructor (e.g. `resize-observer-polyfill`)
   */
  ResizeObserverImpl?: ResizeObserverCtor
  /**
   * Optional: callback mode — if provided, the hook will not re-render,
   * it will just call `onResize` when size changes.
   */
  onResize?: (size: Size) => void
}
/**
 * A lightweight version of the `useResizeObserver` hook (https://usehooks-ts.com/react-hook/use-resize-observer).
 *
 * Differences from the original:
 * - Only supports the default `'content-box'` model
 * - Optional polyfill injection (`ResizeObserverImpl`)
 */
function useContainerResize<T extends HTMLElement = HTMLElement>({
  ref,
  ResizeObserverImpl,
  onResize: onResizeProp,
}: UseContainerResizeOptions<T>): Size {
  const [size, setSize] = useState<Size>({})
  const prev = useRef<Size>({})
  const onResize = useEventCallback(onResizeProp)
  const hasOnResize = onResizeProp !== undefined

  useIsomorphicLayoutEffect(() => {
    const element = ref.current
    if (!element) return

    const updateSize = (width: number, height: number) => {
      const changed = width !== prev.current.width
        || height !== prev.current.height

      if (!changed) return

      const next: Size = { width, height }
      prev.current = next
      if (hasOnResize) {
        onResize(next)
      } else {
        setSize(next)
      }
    }

    const rect = element.getBoundingClientRect()
    updateSize(rect.width, rect.height)

    // SSR & Polyfill
    // Prefer injected ctor; otherwise read from the environment in a typed way.
    const RO: ResizeObserverCtor | undefined = ResizeObserverImpl
      ?? ((typeof window !== 'undefined' && 'ResizeObserver' in window)
        ? window.ResizeObserver
        : undefined)

    if (!RO) return

    const observer: ResizeObserver = new RO(
      (entries) => {
        const entry = entries[0]
        if (!entry) return
        let width = 0
        let height = 0

        const cbsUnknown = entry.contentBoxSize as unknown

        if (Array.isArray(cbsUnknown)) {
          // The standard makes contentBoxSize an array...
          const first = entry.contentBoxSize[0]
          if (first) {
            width = first.inlineSize
            height = first.blockSize
          }
        } else if (isContentBoxSizeSingleItem(cbsUnknown)) {
          // ... but old versions of Firefox treat it as a single item
          width = cbsUnknown.inlineSize
          height = cbsUnknown.blockSize
        } else {
          // fallback to legacy API
          width = entry.contentRect.width
          height = entry.contentRect.height
        }

        updateSize(width, height)
      },
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [ref, ResizeObserverImpl, hasOnResize, onResize])

  return size
}

export { useContainerResize }

function isContentBoxSizeSingleItem(
  v: unknown,
): v is { inlineSize: number, blockSize: number } {
  return (
    typeof v === 'object'
    && v !== null
    && typeof (v as { inlineSize?: unknown }).inlineSize === 'number'
    && typeof (v as { blockSize?: unknown }).blockSize === 'number'
  )
}
