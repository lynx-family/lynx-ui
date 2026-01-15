// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

export function delayFrames(frames: number, callback: () => void): void {
  let count = 0

  const frameHandler = () => {
    count++
    if (count >= frames) {
      callback()
    } else {
      // (TODO) Currently the requestAnimation has bug on reactLynx 0.109.3. After it fixed, replace lynx.requestAnimationFrame with it.
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      lynx.requestAnimationFrame(frameHandler)
    }
  }
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  lynx.requestAnimationFrame(frameHandler)
}
