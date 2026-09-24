// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

export function normalizeIndex(index: number, count: number): number {
  if (!Number.isFinite(index) || count === 0) return 0
  return Math.min(Math.max(Math.trunc(index), 0), count - 1)
}
