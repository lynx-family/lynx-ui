// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import {
  createContext,
  forwardRef,
  useContext,
  useMainThreadRef,
  useMemo,
} from '@lynx-js/react'
import type { MutableRefObject } from '@lynx-js/react'

import { log } from '@lynx-js/lynx-ui-common'
import { useMainThreadImperativeHandle } from '@lynx-js/react-use'
import type { MainThread, NodesRef } from '@lynx-js/types'

import type { DraggableAreaProps, DraggableProps } from './types/index.docs'
import { useDraggable } from './useDraggable'
import type { useDraggableEventsHandlers } from './useDraggable'

export const Draggable = forwardRef<NodesRef, DraggableProps>(
  (props, ref) => {
    const {
      children,
      style,
      className,
      MTSRef,
      draggableProps,
      id,
      debugLog = false,
      ...dragOptions
    } = props
    log(
      debugLog,
      'Draggable',
      dragOptions.minTranslateY,
      dragOptions.maxTranslateY,
    )
    const viewRef: MutableRefObject<MainThread.Element | null> =
      useMainThreadRef<
        MainThread.Element
      >(null)
    const { eventHandlers, utils } = useDraggable({
      ...dragOptions,
      draggableNodeRef: viewRef,
    })

    useMainThreadImperativeHandle(
      MTSRef,
      () => {
        'main thread'
        return {
          MTSResetInternalTranslateValues: utils.resetInternalValues,
          MTSSetTransform: utils.setTransform,
          MTSSetOtherStyles: utils.setStyleProperties,
        }
      },
      [],
    )

    return (
      <view
        ref={(node) => {
          if (ref) {
            if (typeof ref === 'function') {
              ref(node)
            } else if (ref) {
              ref.current = node
            }
          }
        }}
        id={id}
        ios-enable-simultaneous-touch={true}
        {...draggableProps}
        {...eventHandlers}
        main-thread:ref={viewRef}
        style={style}
        className={className}
      >
        {children}
      </view>
    )
  },
)

const DraggableContext = createContext<
  { eventHandlers: useDraggableEventsHandlers | Record<string, never> }
>({ eventHandlers: {} as useDraggableEventsHandlers | Record<string, never> })

export const DraggableRoot = forwardRef<NodesRef, DraggableProps>(
  (props, ref) => {
    const {
      children,
      style,
      className,
      MTSRef,
      id,
      draggableProps,
      ...dragOptions
    } = props
    const viewRef: MutableRefObject<MainThread.Element | null> =
      useMainThreadRef<
        MainThread.Element
      >(null)
    const { eventHandlers: handlers, utils } = useDraggable({
      ...dragOptions,
      draggableNodeRef: viewRef,
    })

    useMainThreadImperativeHandle(
      MTSRef,
      () => {
        'main thread'
        return {
          MTSResetInternalTranslateValues: utils.resetInternalValues,
          MTSSetTransform: utils.setTransform,
          MTSSetOtherStyles: utils.setStyleProperties,
        }
      },
      [],
    )

    const draggableContextValue = useMemo(() => ({
      eventHandlers: handlers,
    }), [handlers])

    return (
      <DraggableContext.Provider value={draggableContextValue}>
        <view
          id={id}
          ref={(node) => {
            if (ref) {
              if (typeof ref === 'function') {
                ref(node)
              } else {
                ref.current = node
              }
            }
          }}
          {...draggableProps}
          main-thread:ref={viewRef}
          style={style}
          className={className}
        >
          {children}
        </view>
      </DraggableContext.Provider>
    )
  },
)

export function DraggableArea(props: DraggableAreaProps) {
  const { style, className, children, id } = props
  const { eventHandlers } = useContext(DraggableContext)
  return (
    <view
      id={id}
      ios-enable-simultaneous-touch={true}
      {...eventHandlers}
      style={style}
      className={className}
    >
      {children}
    </view>
  )
}
