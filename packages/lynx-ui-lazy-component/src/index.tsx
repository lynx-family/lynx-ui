// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { forwardRef, memo, useRef, useState } from '@lynx-js/react'
import type { ForwardedRef } from '@lynx-js/react'

import { useGlobalEventListener } from '@lynx-js/lynx-ui-common'
import './styles.css'
import type { LayoutChangeEvent } from '@lynx-js/types'

import type {
  LazyComponentProps,
  LazyComponentRef,
  LazyComponent as LazyComponentType,
} from './types'

export type { LazyComponentRef, LazyComponentProps }

export const LazyComponent = memo(
  forwardRef(LazyComponentImpl),
) as LazyComponentType

/**
 * @example
 * ```javascript
      <LazyComponent
        scene={'scene'}
        pid={`pid_1`}
        estimatedStyle={{width:"1px", height:"1px"}}>
            <text>Hello, ReactLynx 3!</text>
      </LazyComponent>
 * ```
 */
function LazyComponentImpl(
  props: LazyComponentProps,
  _ref: ForwardedRef<LazyComponentRef>,
) {
  const {
    pid,
    scene,
    estimatedStyle,
    top = '10px',
    bottom = '10px',
    left = '10px',
    right = '10px',
    unloadable = false,
    children,
  } = props
  const [show, setShow] = useState<boolean>(false)
  const cacheSizeRef = useRef<{ width: string, height: string }>(undefined)

  useGlobalEventListener(
    'exposure',
    (events: unknown[]) => {
      'background-only'

      events.forEach(event => {
        if (
          !show
          // @ts-expect-error exposure-scene and exposure-id is currently not declared in eventProps
          && event['exposure-scene'] === scene
          // @ts-expect-error exposure-scene and exposure-id is currently not declared in eventProps
          && event['exposure-id'] === pid
        ) {
          setShow(true)
        }
      })
    },
    [show],
  )

  const onLayoutChange = ({ detail }: LayoutChangeEvent) => {
    if (show) {
      cacheSizeRef.current = {
        width: `${detail.width}px`,
        height: `${detail.height}px`,
      }
    }
  }

  useGlobalEventListener(
    'disexposure',
    (events: unknown[]) => {
      'background-only'

      if (unloadable) {
        events.forEach(event => {
          if (
            // @ts-expect-error exposure-scene and exposure-id is currently not declared in eventProps
            event['exposure-scene'] === scene
            // @ts-expect-error exposure-scene and exposure-id is currently not declared in eventProps
            && event['exposure-id'] === pid
          ) {
            setShow(false)
          }
        })
      }
    },
    [unloadable],
  )

  if (unloadable) {
    const { width, height, ...restsStyles } = estimatedStyle
    return (
      <view
        id='component'
        className='min'
        flatten={false}
        exposure-screen-margin-top={top}
        exposure-screen-margin-bottom={bottom}
        exposure-screen-margin-left={left}
        exposure-screen-margin-right={right}
        exposure-id={pid}
        exposure-scene={scene}
        bindlayoutchange={onLayoutChange}
        style={show
          ? {}
          : {
            width: cacheSizeRef.current?.width ?? width,
            height: cacheSizeRef.current?.height ?? height,
            ...restsStyles,
          }}
      >
        {show && children}
      </view>
    )
  } else {
    return show ? children : (
      <view
        id='component'
        className='min'
        flatten={false}
        exposure-screen-margin-top={top}
        exposure-screen-margin-bottom={bottom}
        exposure-screen-margin-left={left}
        exposure-screen-margin-right={right}
        exposure-id={pid}
        exposure-scene={scene}
        style={estimatedStyle}
      />
    )
  }
}
