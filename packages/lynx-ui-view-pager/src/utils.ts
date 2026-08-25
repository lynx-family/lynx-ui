// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { LazyOptions } from '@lynx-js/lynx-ui-common'

type ExposureMargin = `${number}px` | `${number}rpx`

interface LegacyLazyOptions {
  scene?: string
  exposureLeft?: string
  exposureRight?: string
}

interface ResolvedLazyOptions {
  enableLazy: boolean
  scene: string
  exposureLeft: ExposureMargin
  exposureRight: ExposureMargin
}

let globalViewPagerId = 0

export function createViewPagerId(): string {
  return `lynx-ui-view-pager-${globalViewPagerId++}`
}

export function resolveLazyOptions(
  lazyOptions: LazyOptions | undefined,
  legacyOptions: LegacyLazyOptions,
): ResolvedLazyOptions {
  const enableLazy = lazyOptions?.enableLazy ?? true
  const enabledOptions = lazyOptions?.enableLazy === true
    ? lazyOptions
    : undefined

  return {
    enableLazy,
    scene: enabledOptions?.scene ?? legacyOptions.scene ?? 'viewpager',
    exposureLeft: (enabledOptions?.exposureLeft
      ?? legacyOptions.exposureLeft
      ?? '50px') as ExposureMargin,
    exposureRight: (enabledOptions?.exposureRight
      ?? legacyOptions.exposureRight
      ?? '50px') as ExposureMargin,
  }
}
