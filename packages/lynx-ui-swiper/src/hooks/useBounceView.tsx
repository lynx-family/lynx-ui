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
      <view
        class={RTL
          ? 'lynx-ui-swiper__bounce-start-rtl'
          : 'lynx-ui-swiper__bounce-start'}
      >
        {startBounceItem}
      </view>
    )
    : null

  const shouldShowEndBounce = mode === 'normal' && loop === false
    && count * itemWidth >= containerWidth

  const bounceEndView = endBounceItem && shouldShowEndBounce
    ? (
      <view
        class={RTL
          ? 'lynx-ui-swiper__bounce-end-rtl'
          : 'lynx-ui-swiper__bounce-end'}
      >
        {endBounceItem}
      </view>
    )
    : null

  return { bounceStartView, bounceEndView }
}

export { useBounceView }
