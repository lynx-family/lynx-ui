// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { useEffect, useRef, useState } from '@lynx-js/react'

import { convertOverlayMode, delayFrames, log } from '@lynx-js/lynx-ui-common'
import type { BaseEvent, NodesRef } from '@lynx-js/types'

import type { OverlayViewProps } from './types'

let globalOverlayViewId = 0
// A full-screen popper. Can be a overlay or a view.
export const OverlayView = (props: OverlayViewProps) => {
  const {
    id,
    container,
    children,
    className,
    style,
    overlayLevel,
    debugLog = false,
    overlayViewProps,
  } = props
  const containerRef = useRef<NodesRef>(null)
  // @ts-expect-error 'event-through' only works on overlay
  const { 'event-through': eventThrough = true, ...restOverlayProps } =
    overlayViewProps ?? {}
  const [overlayViewId, _] = useState<string>(
    id
      ?? (() => `lynx-ui-overlay-viewport-${globalOverlayViewId++}`),
  )
  const [initialOverlayLevel] = useState(overlayLevel)
  log(debugLog, '[OverlayView] id:', overlayViewId, 'container:', container)
  const handleShowOverlay = (e: BaseEvent) => {
    log(debugLog, '[OverlayView] handleShowOverlay', e)
  }

  // If the overlayLevel is given, then the overlay should be visible after it's set. Otherwise, it may cause exception on Android.
  const [isOverlayVisible, setIsOverlayVisible] = useState(
    initialOverlayLevel === undefined,
  )

  useEffect(() => {
    if (initialOverlayLevel !== undefined) {
      delayFrames(2, () => {
        setIsOverlayVisible(true)
      })
    }
  }, [])

  return container
    ? (
      <overlay
        custom-layout={true}
        visible={isOverlayVisible}
        style={{ overflow: 'visible', position: 'fixed' }}
        mode={convertOverlayMode(container)}
        bindshowoverlay={handleShowOverlay}
        events-pass-through={true}
        cut-out-mode={true}
        level={initialOverlayLevel}
        id={overlayViewId}
        {...restOverlayProps}
      >
        <view
          style={style}
          className={className}
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          event-through={eventThrough}
        >
          {children}
        </view>
      </overlay>
    )
    : (
      <view
        ref={containerRef}
        className={className}
        style={style}
        id={overlayViewId}
        {...overlayViewProps}
      >
        {children}
      </view>
    )
}
