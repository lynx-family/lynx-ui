// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { memo, useEffect, useMemo, useRef, useState } from '@lynx-js/react'
import type { RefObject } from '@lynx-js/react'

import {
  getRectByRef,
  invokeById,
  setNativePropsByRef,
  useGlobalEventListener,
} from '@lynx-js/lynx-ui-common'
import type { NodesRef } from '@lynx-js/types'

import { KeyboardAwareRootContext } from './KeyboardAwareContext'
import type {
  KeyboardAwareRootProps,
  KeyboardAwareRoot as KeyboardAwareRootType,
} from './types'

export type { KeyboardAwareRootProps }

export const KeyboardAwareRoot = memo(
  KeyboardAwareRootImpl,
) as KeyboardAwareRootType

export function KeyboardAwareRootImpl(props: KeyboardAwareRootProps) {
  const {
    forceAttach = false,
    androidStatusBarPlusBottomBarHeight = 0,
    children,
  } = props
  const [keyboardHeightInPx, setKeyboardHeightInPx] = useState<number>(0)
  const [
    previousKeyboardResponderTranslateY,
    setPreviousKeyboardResponderTranslateY,
  ] = useState<number>(0)
  const invalidFocusedRef = useRef<NodesRef>(null)
  // Use a state to store the focused awareness ref which make sure that updates of `focusedRef` is responded BATCHED in `useEffect` so that the keyboard will not be dismissed and displayed again while the focus is switched between 2 different `<Input>`s.
  const [focusedRef, setFocusedRef] = useState<RefObject<NodesRef>>(
    invalidFocusedRef,
  )
  const refOfFocusedRef = useRef<unknown>(null)

  const firstTimeFocused = useRef<boolean>(true)

  const focusedRefOffset = useRef<number>(0)

  const keyboardAwareResponderRef = useRef<NodesRef>(null)

  const keyboardAwareResponderScrollInfo = useRef<{
    scrollviewId: string
    scrollContentId: string
    dummyRefAtKeyboardHeight: RefObject<NodesRef>
    marginBetweenScrollViewBottomAndScreenBottom: number
  }>()

  const keyboardAwareResponderScrollInfoCollected = (
    scrollviewId?: string,
    scrollContentId?: string,
    dummyRefAtKeyboardHeight?: RefObject<NodesRef>,
  ) => {
    if (scrollviewId && scrollContentId && dummyRefAtKeyboardHeight?.current) {
      getRectByRef(keyboardAwareResponderRef, true).then((rect) => {
        const { pixelHeight, pixelRatio, platform } = SystemInfo

        // boundingClientRect did not take statusBar into account on Android!
        const marginBetweenScrollViewBottomAndScreenBottom: number =
          pixelHeight / pixelRatio
          - rect.bottom
          - (platform === 'Android'
            ? androidStatusBarPlusBottomBarHeight
            : 0)
        keyboardAwareResponderScrollInfo.current = {
          scrollviewId,
          scrollContentId,
          dummyRefAtKeyboardHeight,
          marginBetweenScrollViewBottomAndScreenBottom,
        }
      })
    }
  }

  const onAwareTriggerFocused = (
    triggerRef: RefObject<NodesRef>,
    offset?: number,
  ) => {
    refOfFocusedRef.current = triggerRef
    setFocusedRef(triggerRef)
    focusedRefOffset.current = offset ?? 0
  }

  const onAwareTriggerBlurred = (triggerRef: RefObject<NodesRef>) => {
    // Delay the blur event to make sure that the keyboard is dismissed before the blur event is triggered.
    setTimeout(() => {
      if (
        triggerRef.current && refOfFocusedRef.current == triggerRef
      ) {
        setFocusedRef(invalidFocusedRef)
        refOfFocusedRef.current = null
      }
    }, 30)
  }

  const onAwareTriggerLayoutChanged = (triggerRef: RefObject<NodesRef>) => {
    if (focusedRef.current && focusedRef.current == triggerRef.current) {
      adjustThePositionOfKeyboardResponder()
    }
  }

  const adjustThePositionOfKeyboardResponder = () => {
    if (
      keyboardHeightInPx === 0
      || !keyboardAwareResponderRef?.current
      || !focusedRef?.current
    ) {
      if (keyboardAwareResponderScrollInfo.current) {
        const { dummyRefAtKeyboardHeight } =
          keyboardAwareResponderScrollInfo.current
        setNativePropsByRef(dummyRefAtKeyboardHeight, {
          height: `${0}px`,
        })

        if (!focusedRef?.current) {
          firstTimeFocused.current = true
        }
      } else {
        setNativePropsByRef(keyboardAwareResponderRef, {
          transform: `translateY(${0}px)`,
          transition: 'transform 0.2s',
        })
        setPreviousKeyboardResponderTranslateY(0)
      }
    } else {
      if (keyboardAwareResponderScrollInfo.current) {
        const {
          scrollviewId,
          scrollContentId,
          dummyRefAtKeyboardHeight,
          marginBetweenScrollViewBottomAndScreenBottom,
        } = keyboardAwareResponderScrollInfo.current

        if (firstTimeFocused.current) {
          setNativePropsByRef(dummyRefAtKeyboardHeight, {
            height: `${
              keyboardHeightInPx
              - marginBetweenScrollViewBottomAndScreenBottom
            }px`,
          })
        }
        scrollToTarget(
          scrollviewId,
          scrollContentId,
          -marginBetweenScrollViewBottomAndScreenBottom,
          true,
        )
        firstTimeFocused.current = false
      } else {
        doAdjustThePositionOfViewInKeyboardResponder(focusedRef)
      }
    }
  }

  const scrollToTarget = (
    scrollviewId: string,
    scrollContentId: string,
    offset: number,
    smooth: boolean,
  ) => {
    getRectByRef(focusedRef, false, scrollContentId).then(
      (focusedRect) => {
        getRectByRef(keyboardAwareResponderRef, true).then(
          (responderRect) => {
            invokeById(scrollviewId, 'scrollTo', {
              index: 0,
              offset: keyboardHeightInPx
                + focusedRect.bottom
                - responderRect.height
                - focusedRefOffset.current + offset,
              smooth: smooth,
            }).catch(() => {
              // do nothing
            })
          },
        )
      },
    )
  }

  const doAdjustThePositionOfViewInKeyboardResponder = (
    KeyboardAwareTriggerRef: RefObject<NodesRef>,
    transition = 'transform 0.28s',
  ) => {
    getRectByRef(KeyboardAwareTriggerRef, true).then((rect) => {
      const { pixelHeight, pixelRatio, platform } = SystemInfo

      // boundingClientRect did not take statusBar into account on Android!
      const marginBetweenInputBottomAndScreenBottom: number =
        pixelHeight / pixelRatio
        - rect.bottom
        - (platform === 'Android' ? androidStatusBarPlusBottomBarHeight : 0)

      let translateY: number = marginBetweenInputBottomAndScreenBottom
        - keyboardHeightInPx
        + previousKeyboardResponderTranslateY
        + focusedRefOffset.current

      if (!forceAttach && translateY >= 0) {
        translateY = 0
      }

      setNativePropsByRef(keyboardAwareResponderRef, {
        transform: `translateY(${translateY}px)`,
        transition: transition,
      })
      setPreviousKeyboardResponderTranslateY(translateY)
    })
  }

  useGlobalEventListener(
    'keyboardstatuschanged',
    (status, keyboardHeight: number, _legacyKeyboardHeight) => {
      setKeyboardHeightInPx?.(status === 'on' ? keyboardHeight : 0)
    },
    [],
  )

  useEffect(() => {
    // Update the position of keyboard responder when keyboard height or focused ref changed
    adjustThePositionOfKeyboardResponder()
  }, [keyboardHeightInPx, focusedRef])

  const keyboardAwareContextValue = useMemo(
    () => ({
      onAwareTriggerFocused,
      onAwareTriggerBlurred,
      onAwareTriggerLayoutChanged,
      keyboardAwareResponder: keyboardAwareResponderRef,
      keyboardAwareResponderScrollInfoCollected,
    }),
    [
      onAwareTriggerFocused,
      onAwareTriggerBlurred,
      onAwareTriggerLayoutChanged,
      focusedRef,
      keyboardAwareResponderScrollInfoCollected,
    ],
  )

  return (
    <KeyboardAwareRootContext.Provider value={keyboardAwareContextValue}>
      {children}
    </KeyboardAwareRootContext.Provider>
  )
}
