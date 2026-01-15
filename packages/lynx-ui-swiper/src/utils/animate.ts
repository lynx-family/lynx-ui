// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

export function animate(
  duration: number,
  onUpdate: (progress: number) => void,
  onFinished?: () => void,
) {
  'main thread'
  let startTs = 0
  let rafId = 0

  function tick(ts: number) {
    const progress = Math.max(
      Math.min(((ts - startTs) * 100) / duration, 100),
      0,
    )

    onUpdate(progress)
  }

  function updateRafId(id: number) {
    rafId = id
  }

  function step(ts: number) {
    if (!startTs) {
      startTs = Number(ts)
    }
    // make sure progress can reach 100%
    if (ts - startTs <= duration + 100) {
      tick(ts)
      updateRafId(requestAnimationFrame(step))
    } else {
      onFinished?.()
    }
  }

  updateRafId(requestAnimationFrame(step))

  function cancel() {
    cancelAnimationFrame(rafId)
  }

  return {
    cancel,
  }
}
