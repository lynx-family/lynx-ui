// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

export const pages = [
  { id: 'compact', height: 260 },
  { id: 'standard', height: 420 },
  { id: 'expanded', height: 560 },
  { id: 'finale', height: 340 },
]

export type DynamicHeightPage = (typeof pages)[number]
