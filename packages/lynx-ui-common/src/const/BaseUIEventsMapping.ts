// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

export const ExposureEventsMapping: Record<string, string> = {
  onUIAppear: 'binduiappear',
  onUIDisappear: 'binduidisappear',
}
export const LayoutEventsMapping: Record<string, string> = {
  onLayoutChange: 'bindlayoutchange',
}
export const TouchEventsMapping: Record<string, string> = {
  onTouchStart: 'bindtouchstart',
  onTouchMove: 'bindtouchmove',
  onTouchEnd: 'bindtouchend',
  onTouchCancel: 'bindtouchcancel',
  onTouchTap: 'bindtap',
  onLongPress: 'bindlongpress',
  catchTouchStart: 'catchtouchstart',
  catchTouchMove: 'catchtouchmove',
  catchTouchEnd: 'catchtouchend',
  catchTouchCancel: 'catchtouchcancel',
  catchTap: 'catchtap',
  catchLongPress: 'catchlongpress',
}
