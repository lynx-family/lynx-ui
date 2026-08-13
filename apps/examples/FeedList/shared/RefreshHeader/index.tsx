// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import './index.css'

interface RefreshHeaderProps {
  text?: string
}

const REFRESH_SPINNER_URL =
  'https://lf-lynx.tiktok-cdns.com/obj/lynx-artifacts-oss-sg/plugin/static/loading.gif'

export function RefreshHeader(props: RefreshHeaderProps) {
  const { text } = props

  return (
    <view className='refresh-header'>
      <image
        src={REFRESH_SPINNER_URL}
        className='refresh-header__spinner'
      />
      {text ? <text className='refresh-header__text'>{text}</text> : null}
    </view>
  )
}
