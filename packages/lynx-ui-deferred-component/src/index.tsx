// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { forwardRef, memo, useState } from '@lynx-js/react'
import type { ForwardedRef } from '@lynx-js/react'

import { delayFrames as delayFramesUtil } from '@lynx-js/lynx-ui-common'
import type { LayoutChangeEvent } from '@lynx-js/types'

import './styles.css'

import type {
  DeferredComponentProps,
  DeferredComponentRef,
  DeferredComponent as DeferredComponentType,
} from './types/index.js'

export type { DeferredComponentRef, DeferredComponentProps }

export const DeferredComponent = memo(
  forwardRef(DeferredComponentImpl),
) as DeferredComponentType

/**
 * @example
 * ```javascript
      <DeferredComponent
        estimatedStyle={{width:"1px", height:"1px"}}>
            <text>Hello, ReactLynx 3!</text>
      </DeferredComponent>
 * ```
 */
function DeferredComponentImpl(
  props: DeferredComponentProps,
  _ref: ForwardedRef<DeferredComponentRef>,
) {
  const {
    estimatedStyle,
    placeholder,
    delayFrames = 1,
    children,
    onLayoutChange,
  } = props

  const [show, setShow] = useState<boolean>(false)

  const onLayoutChangeInternal = ({ detail }: LayoutChangeEvent) => {
    if (show) {
      onLayoutChange?.(detail)
    } else {
      if (delayFrames === 1) {
        setShow(true)
      } else {
        delayFramesUtil(delayFrames - 1, () => setShow(true))
      }
    }
  }

  if (!Number.isFinite(delayFrames) || delayFrames < 1) {
    return children
  }

  return (
    <view
      className='lynx-ui-deferred-component__invisible'
      flatten={false}
      bindlayoutchange={onLayoutChangeInternal}
      style={estimatedStyle}
    >
      {!show && placeholder}
      {show && children}
    </view>
  )
}
