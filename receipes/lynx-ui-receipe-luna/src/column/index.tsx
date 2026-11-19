// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { Flex } from '../flex/index.js'
import type { ColumnProps } from '../types/index.docs.js'

export function Column(props: ColumnProps) {
  return <Flex {...props} direction='column' />
}
