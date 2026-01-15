// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { createContext } from '@lynx-js/react'
import type { RefObject } from '@lynx-js/react'

import type { NodesRef } from '@lynx-js/types'

export const KeyboardAwareRootContext = createContext<{
  onAwareTriggerFocused?: (
    triggerRef?: RefObject<NodesRef>,
    offset?: number,
  ) => void
  onAwareTriggerBlurred?: (triggerRef?: RefObject<NodesRef>) => void
  onAwareTriggerLayoutChanged?: (triggerRef: RefObject<NodesRef>) => void
  keyboardAwareResponder?: RefObject<NodesRef>
  keyboardAwareResponderScrollInfoCollected?: (
    scrollviewId?: string,
    scrollContentId?: string,
    dummyRefAtKeyboardHeight?: RefObject<NodesRef>,
  ) => void
}>({
  onAwareTriggerFocused: undefined,
  onAwareTriggerBlurred: undefined,
  keyboardAwareResponder: undefined,
  keyboardAwareResponderScrollInfoCollected: undefined,
})

export const KeyboardAwareTriggerContext = createContext<{
  onInputFocused?: () => void
  onInputBlurred?: () => void
}>({
  onInputFocused: undefined,
  onInputBlurred: undefined,
})
