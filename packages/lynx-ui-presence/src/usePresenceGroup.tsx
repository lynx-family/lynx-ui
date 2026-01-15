// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from '@lynx-js/react'
import type { ReactNode } from '@lynx-js/react'

import { Presence } from './Presence'
import type { PresenceChildrenType, PresenceContextType } from './types'
import { PresenceState } from './utils'

export const PresenceContext = createContext<PresenceContextType>(null!)

export interface usePresenceGroupProps {
  show: boolean
  forceMount: boolean
  setGroupState?: (state: PresenceState) => void
  enableDelay?: boolean
  children?:
    | ReactNode
    | PresenceChildrenType
    | Array<ReactNode | PresenceChildrenType>
  onOpen?: () => void
  onClose?: () => void
}

export interface usePresenceGroupReturnType {
  renderChildren: ReactNode
  mountView: boolean
}
// Manage a group of Presence components.
// Wrap all child nodes with Presence and ensure that the onOpen and onClose events are triggered after all animations are completed.
export const usePresenceGroup: (
  props: usePresenceGroupProps,
) => usePresenceGroupReturnType = (props) => {
  const {
    show,
    forceMount = false,
    children,
    enableDelay = false,
    onOpen,
    onClose,
    setGroupState,
  } = props

  const [_, setMountingChildrenCount] = useState<number>(
    0,
  )
  const [mountView, setMountView] = useState<boolean>(show)

  const childrenSize = Array.isArray(children)
    ? children.length
    : (children ? 1 : 0)
  const [stateGroup, setStateGroup] = useState<PresenceState[]>(
    Array.from({ length: childrenSize }, () => PresenceState.Left),
  )

  // Determine the overall state based on the stateGroup
  const getGroupState = (states: PresenceState[]): PresenceState => {
    // The state in Presence will stop the PresenceState from changing to DelayedEntering if the delay is disabled. No need to double check it in upper presence group.
    if (
      states.some(state => state === PresenceState.DelayedEntering)
    ) {
      return PresenceState.DelayedEntering
    }
    if (
      states.some(state => state === PresenceState.Entering)
    ) {
      return PresenceState.Entering
    }
    if (states.some(state => state === PresenceState.Leaving)) {
      return PresenceState.Leaving
    }
    if (states.every(state => state === PresenceState.Entered)) {
      return PresenceState.Entered
    }
    if (states.every(state => state === PresenceState.Left)) {
      return PresenceState.Left
    }
    return PresenceState.Left
  }

  const updateStateGroup = (index: number, newState: PresenceState) => {
    setStateGroup(prev => {
      const newStateGroup = [...prev]
      newStateGroup[index] = newState
      if (setGroupState) {
        setGroupState(getGroupState(newStateGroup))
      }
      return newStateGroup
    })
  }

  const onChildOpen = useCallback(() => {
    setMountingChildrenCount((prev) => {
      const count = prev + 1
      if (
        children
        && ((Array.isArray(children) && count === children.length)
          || (!Array.isArray(children) && count === 1))
      ) {
        onOpen?.()
      }
      return count
    })
  }, [children, onOpen])

  const onChildClose = useCallback(() => {
    setMountingChildrenCount((prev) => {
      const count = prev - 1
      if (count === 0) {
        onClose?.()
        setMountView(false)
      }
      return count
    })
  }, [onClose])

  const renderChildren = useMemo(() => {
    return Array.isArray(children)
      ? children.map((child: ReactNode, index: number) => {
        return (
          <Presence
            show={show}
            forceMount={forceMount}
            state={stateGroup[index]}
            setPresenceState={(state: PresenceState) =>
              updateStateGroup(index, state)}
            enableDelay={enableDelay}
            onOpen={onChildOpen}
            onClose={onChildClose}
          >
            {child}
          </Presence>
        )
      })
      : (children
        ? (
          <Presence
            show={show}
            forceMount={forceMount}
            state={stateGroup[0]}
            setPresenceState={(state: PresenceState) =>
              updateStateGroup(0, state)}
            enableDelay={enableDelay}
            onOpen={onChildOpen}
            onClose={onChildClose}
          >
            {children}
          </Presence>
        )
        : null)
  }, [show, children, stateGroup, onChildClose, onChildOpen, forceMount])

  useEffect(() => {
    if (show) {
      setMountView(true)
    }
  }, [show])

  return {
    renderChildren,
    mountView,
  }
}
