// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { memo, useContext, useEffect, useRef } from '@lynx-js/react'

import { ScrollView } from '@lynx-js/lynx-ui-scroll-view'
import type { NodesRef } from '@lynx-js/types'

import { KeyboardAwareRootContext } from './KeyboardAwareContext'
import type {
  KeyboardAwareResponderProps,
  KeyboardAwareResponder as KeyboardAwareResponderType,
} from './types'

export type { KeyboardAwareResponderProps }

export const KeyboardAwareResponder = memo(
  KeyboardAwareResponderImpl,
) as KeyboardAwareResponderType

export function KeyboardAwareResponderImpl(props: KeyboardAwareResponderProps) {
  const {
    as = 'View',
    scrollviewId = 'scrollview',
    style,
    className,
    children,
    ...rest
  } = props
  const { width = '100%', height = '100%', ...restStyle } = style ?? {}
  const { keyboardAwareResponder, keyboardAwareResponderScrollInfoCollected } =
    useContext(KeyboardAwareRootContext)

  const dummyRefAtKeyboardHeight = useRef<NodesRef>(null)
  useEffect(() => {
    keyboardAwareResponderScrollInfoCollected?.(
      scrollviewId,
      `keyboard-aware-trigger-scroll-content-${scrollviewId}`,
      dummyRefAtKeyboardHeight,
    )
  }, [dummyRefAtKeyboardHeight, keyboardAwareResponder])

  return (
    <view
      style={{ width, height, ...(as === 'ScrollView' ? {} : restStyle) }}
      className={as === 'ScrollView' ? undefined : className}
      {...rest}
      ref={keyboardAwareResponder}
      flatten={false}
    >
      {as === 'ScrollView'
        ? (
          <ScrollView
            style={{ width: '100%', height: '100%', ...restStyle }}
            scrollviewId={scrollviewId}
            className={className}
            {...rest}
            scrollOrientation='vertical'
          >
            <view
              id={`keyboard-aware-trigger-scroll-content-${scrollviewId}`}
              style={{
                width: '100%',
                display: 'linear',
                linearOrientation: 'vertical',
              }}
            >
              {children}
              <view
                ref={dummyRefAtKeyboardHeight}
                style={{ width: '1px', background: 'red' }}
              />
            </view>
          </ScrollView>
        )
        : children}
    </view>
  )
}
