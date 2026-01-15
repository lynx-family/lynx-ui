// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import {
  runOnMainThread,
  useEffect,
  useMainThreadRef,
  useRef,
} from '@lynx-js/react'

import { useMemoizedFn } from '@lynx-js/lynx-ui-common'

interface IAutoPlay {
  autoPlay: boolean
  duration: number
  dataCount: number
  autoPlayInterval: number
  prevMT: () => void
  nextMT: () => void
}

export function useAutoplay({
  autoPlay,
  autoPlayInterval,
  nextMT,
  duration,
}: IAutoPlay) {
  const stoppedRef = useRef<boolean>(false)
  const timerMTRef = useMainThreadRef<number>(0)
  const stoppedMTRef = useMainThreadRef<boolean>(false)
  const autoPlayMTRef = useMainThreadRef<boolean>(autoPlay)

  function playMT() {
    'main thread'
    if (stoppedRef.current || !autoPlayMTRef.current) {
      return
    }

    timerMTRef.current && clearTimeout(timerMTRef.current)
    timerMTRef.current = setTimeout(() => {
      nextMT()
      playMT()
    }, autoPlayInterval + duration) as unknown as number
  }

  function pauseMT() {
    'main thread'
    if (!autoPlayMTRef.current) {
      return
    }
    timerMTRef.current && clearTimeout(timerMTRef.current)
    stoppedMTRef.current = true
  }

  function startMT() {
    'main thread'
    if (!autoPlayMTRef.current) {
      return
    }
    stoppedMTRef.current = false
    playMT()
  }

  function setAutoPlayRef(autoPlayValue: boolean) {
    'main thread'
    autoPlayMTRef.current = autoPlayValue
  }

  const start = useMemoizedFn(() => {
    runOnMainThread(startMT)()
  })

  const pause = useMemoizedFn(() => {
    runOnMainThread(pauseMT)()
  })

  useEffect(() => {
    runOnMainThread(setAutoPlayRef)(autoPlay)
    if (autoPlay) {
      start()
    } else {
      pause()
    }

    return pause
  }, [start, pause, autoPlay])

  return {
    pause,
    start,
    pauseMT,
    startMT,
  }
}
