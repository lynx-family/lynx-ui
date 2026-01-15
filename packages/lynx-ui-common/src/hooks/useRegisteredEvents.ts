// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { useMainThreadRef } from '@lynx-js/react'

import { mainThreadifyEventsMapping } from '../utils'

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
      mainThreadifyEvents[mainThreadEvents[event]] = e => {
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
    if (event in registeredEventsMapping) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      reducedEvents[registeredEventsMapping[event]] = events[event]
    }
  }
  const mainThreadifyEvents = mainThreadifyEventsMapping(
    registeredEventsMapping,
  )
  const mainThreadifyEventsContents = useMainThreadifyEvents(
    events,
    mainThreadifyEvents,
  )
  return { ...reducedEvents, ...mainThreadifyEventsContents }
}
