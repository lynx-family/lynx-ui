// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

export const mainThreadifyEventsMapping = (
  rawEvents: Record<string, string>,
) => {
  let mainThreadifyEvents: Record<string, string> = {}
  mainThreadifyEvents = Object.entries(rawEvents).reduce(
    (EventsWithMainThread, [key, value]) => {
      EventsWithMainThread[`main-thread:${key}`] = `main-thread:${value}`
      return EventsWithMainThread
    },
    {},
  )
  return mainThreadifyEvents
}
