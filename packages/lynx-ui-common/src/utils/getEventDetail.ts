// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * A type representing event details that may contain layout and positioning information.
 * It includes optional properties for dimensions and coordinates, and allows for other properties.
 */
export type EventDetailWithLayout = {
  left?: number
  top?: number
  right?: number
  bottom?: number
  width?: number
  height?: number
} & Record<string, unknown>

/**
 * Safely retrieves detailed information from an event object.
 * It attempts to access `event.detail` first. If `detail` is not available,
 * it falls back to `event.params`. This is useful for maintaining
 * compatibility across different event structures on different platforms and versions.
 *
 * @param event The event object, which can be of any type.
 * @returns The `detail` or `params` object from the event, or an empty object if neither is found.
 */
export function getEventDetail<
  T extends EventDetailWithLayout = EventDetailWithLayout,
> // biome-ignore lint/suspicious/noExplicitAny: accept any type of events
(event: any): T {
  if (!event) {
    return {} as T
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  return (event.detail ?? event.params ?? {}) as T
}
