// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

const overlayModeMap = new Map<string, string>()

export const registerOverlayMode = (
  mode: string,
  controllerName: string,
): void => {
  overlayModeMap.set(mode, controllerName)
}

export const convertOverlayMode = (
  mode: string,
): string | undefined => {
  if (!mode) {
    return undefined
  }
  // only iOS need this info
  if (overlayModeMap.has(mode)) {
    return overlayModeMap.get(mode)
  }
  return mode
}
