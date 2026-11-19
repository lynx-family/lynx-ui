// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { Flex } from '../flex/index.js'
import type { RowProps } from '../types/index.docs.js'

export function Row(props: RowProps) {
  return <Flex {...props} direction='row' />
}
