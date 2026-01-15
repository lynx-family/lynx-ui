// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { useRef } from '@lynx-js/react'

/**
 * `useLatest` will be useful when you are facing dependency hell.
 * Or you want always-update ref
 */
export function useLatest<T>(value: T) {
  const ref = useRef(value)
  ref.current = value

  return ref
}
