// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { memo, useContext, useMemo, useRef } from '@lynx-js/react'

import type { NodesRef } from '@lynx-js/types'

import {
  KeyboardAwareRootContext,
  KeyboardAwareTriggerContext,
} from './KeyboardAwareContext'
import type {
  KeyboardAwareTriggerProps,
  KeyboardAwareTrigger as KeyboardAwareTriggerType,
} from './types'

export type { KeyboardAwareTriggerProps }

export const KeyboardAwareTrigger = memo(
  KeyboardAwareTriggerImpl,
) as KeyboardAwareTriggerType

export function KeyboardAwareTriggerImpl(props: KeyboardAwareTriggerProps) {
  const { children, offset = 0, ...rest } = props

  const KeyboardAwareTriggerHeight = useRef<number>(0)

  const ref = useRef<NodesRef>(null)
  const {
    onAwareTriggerFocused,
    onAwareTriggerBlurred,
    onAwareTriggerLayoutChanged,
  } = useContext(KeyboardAwareRootContext)

  const onInputFocused = () => {
    onAwareTriggerFocused?.(ref, offset)
  }
  const onInputBlurred = () => {
    onAwareTriggerBlurred?.(ref)
  }

  const KeyboardAwareTriggerContextValue = useMemo(
    () => ({
      onInputFocused,
      onInputBlurred,
    }),
    [onInputFocused, onInputBlurred],
  )

  return (
    <KeyboardAwareTriggerContext.Provider
      value={KeyboardAwareTriggerContextValue}
    >
      <view
        {...rest}
        ref={ref}
        flatten={false}
        ignore-focus
        bindlayoutchange={(e) => {
          // RAF for Android
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore: requestAnimationFrame is not defined in UnsafeLynx
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          lynx.requestAnimationFrame(() => {
            if (KeyboardAwareTriggerHeight.current != e.detail.height) {
              KeyboardAwareTriggerHeight.current = e.detail.height
              onAwareTriggerLayoutChanged?.(ref)
            }
          })
        }}
      >
        {children}
      </view>
    </KeyboardAwareTriggerContext.Provider>
  )
}
