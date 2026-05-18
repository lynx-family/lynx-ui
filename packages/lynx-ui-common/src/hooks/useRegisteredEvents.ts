// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { useMainThreadRef } from '@lynx-js/react'

import { useTouchEmulation } from '@lynx-js/react-use'
import type { TouchEvent } from '@lynx-js/types'

import { mainThreadifyEventsMapping } from '../utils'

// These standard touch callbacks are registered through useTouchEmulation to fit the base touch-style API for both touch and mouse inputs.
const EMULATED_TOUCH_EVENT_NAMES = new Set([
  'onTouchStart',
  'onTouchMove',
  'onTouchEnd',
  'onTouchCancel',
])

const useMainThreadifyEvents = (
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  events: Record<string, any>,
  mainThreadEvents: Record<string, string>, // e.g.: { 'onScroll': bindscroll } -> { 'main-thread:bindscroll': main-thread:bindscroll }
) => {
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  type reducedEventsType = Record<string, any>
  const mainThreadifyEvents: reducedEventsType = {}
  // biome-ignore lint/correctness/noUnusedVariables: <explanation>
  const dummyRef = useMainThreadRef()
  for (const event of Object.keys(events)) {
    if (event in mainThreadEvents) {
      mainThreadifyEvents[mainThreadEvents[event]] = (e: unknown) => {
        'main thread'
        if (events[event]) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          events[event](e)
        }
      }
    }
  }
  return mainThreadifyEvents
}
/**
 * Only bind the events that are passed in and registered in the registeredProps to improve performance.
 * @example
 * ```
 * const XXXOwnedProps: Record<string, string> = {
 *   ...ScrollEvents,
 *   ...ExposureEventsAndProps,
 *   ...TouchEvents,
 *   ...LayoutEvents,
 * };
 * const registerProps = useRegisteredEvents(props, XXXOwnedProps);
 * <XXX {...registerProps} />
 *
 * ```
 */
export const useRegisteredEvents = (
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  events: Record<string, any>,
  registeredEventsMapping: Record<string, string>,
) => {
  // biome-ignore lint/suspicious/noExplicitAny: any
  type reducedEventsType = Record<string, any>
  const reducedEvents: reducedEventsType = {}
  for (const event of Object.keys(events)) {
    if (
      event in registeredEventsMapping
      && !EMULATED_TOUCH_EVENT_NAMES.has(event)
    ) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      reducedEvents[registeredEventsMapping[event]] = events[event]
    }
  }
  const touchHandlers = useTouchEmulation({
    onTouchStart: events.onTouchStart as
      | ((event: TouchEvent) => void)
      | undefined,
    onTouchMove: events.onTouchMove as
      | ((event: TouchEvent) => void)
      | undefined,
    onTouchEnd: events.onTouchEnd as
      | ((event: TouchEvent) => void)
      | undefined,
    onTouchCancel: events.onTouchCancel as
      | ((event: TouchEvent) => void)
      | undefined,
  })
  const mainThreadifyEvents = mainThreadifyEventsMapping(
    registeredEventsMapping,
  )
  const mainThreadifyEventsContents = useMainThreadifyEvents(
    events,
    mainThreadifyEvents,
  )
  return { ...reducedEvents, ...touchHandlers, ...mainThreadifyEventsContents }
}
