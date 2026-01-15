// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { ReactElement } from '@lynx-js/react'

import type { CompoundModeConfig, SwiperProps } from '../types'

function useBounceView({
  startBounceItem,
  endBounceItem,
  RTL,
  itemWidth,
  count,
  containerWidth,
  mode,
  loop,
}: {
  startBounceItem?: ReactElement
  endBounceItem?: ReactElement
  RTL: SwiperProps<unknown>['RTL']
  itemWidth: number
  containerWidth: number
  count: number
  mode: CompoundModeConfig['mode']
  loop: boolean
}) {
  const bounceStartView = startBounceItem
    ? (
      <view class={RTL ? 'bounce-start-item-RTL' : 'bounce-start-item'}>
        {startBounceItem}
      </view>
    )
    : null

  const shouldShowEndBounce = mode === 'normal' && loop === false
    && count * itemWidth >= containerWidth

  const bounceEndView = endBounceItem && shouldShowEndBounce
    ? (
      <view class={RTL ? 'bounce-end-item-RTL' : 'bounce-end-item'}>
        {endBounceItem}
      </view>
    )
    : null

  return { bounceStartView, bounceEndView }
}

export { useBounceView }
