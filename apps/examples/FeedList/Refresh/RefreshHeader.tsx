// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

export function RefreshHeader() {
  return (
    <view className='refresh-header'>
      <image
        src='https://lf-lynx.tiktok-cdns.com/obj/lynx-artifacts-oss-sg/plugin/static/loading.gif'
        className='refresh-header__spinner'
      />
      <text className='refresh-header__text'>Refreshing</text>
    </view>
  )
}
