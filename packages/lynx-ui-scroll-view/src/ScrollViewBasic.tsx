// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { ReactElement } from '@lynx-js/react'

import type { ScrollViewProps as ScrollViewElementProps } from '@lynx-js/types'

function ScrollViewBasic(
  props: {
    elementProps: ScrollViewElementProps
    children?: (ReactElement[] | ReactElement)[] | ReactElement | ReactElement[]
    sticky?: ReactElement
  },
) {
  const { children, sticky, elementProps } = props

  return (
    <scroll-view
      {...elementProps}
      android-touch-slop='page'
      // This is a workaround for using RL3.0-ver 0.110.1 and SDK-ver <=3.4. It will force the scroll-view to update after the BTS is ready and flush the 'name' prop along with __AddEvents. Otherwise, a pure __AddEvents will be discarded by the engine and won't trigger the flush of the prop_bundle. As a result, all events will be lost.
      // We do not use __MAIN_THREAD__ here to maintain compatibility with the old version of @lynx-js/react.
      name={__LEPUS__ ? 'lepus' : 'background'}
    >
      {sticky}
      {children}
    </scroll-view>
  )
}

export default ScrollViewBasic
