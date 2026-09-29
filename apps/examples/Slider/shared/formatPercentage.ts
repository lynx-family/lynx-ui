// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

export function formatPercentage(value: number): string {
  return `${Math.round(value * 100)}%`
}
