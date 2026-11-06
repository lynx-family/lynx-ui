// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * Minimal structural shape of a gesture object for relation setup.
 * Avoids importing the full gesture-runtime types (which pull in Lynx runtime).
 */
export interface GestureRelations<TGesture = unknown> {
  simultaneousWith: TGesture[]
  externalSimultaneous: (gesture: TGesture) => unknown
  waitFor: TGesture[]
  continueWith: TGesture[]
  externalWaitFor: (gesture: TGesture) => unknown
  externalContinueWith: (gesture: TGesture) => unknown
}

/** Native IDs survive the gesture-runtime's render-time object clones. */
function sameGesture(a: unknown, b: unknown): boolean {
  if (a === b) return true
  const first = a as { id?: number }
  const second = b as { id?: number }
  return first?.id !== undefined && first.id === second?.id
}

function appendUnique<T>(
  existing: T[],
  gesture: T,
  append: (gesture: T) => unknown,
) {
  const kind = gesture as { toGestureArray?: () => T[] }
  for (const entry of kind?.toGestureArray?.() ?? [gesture]) {
    if (!existing.some(other => sameGesture(other, entry))) append(entry)
  }
}

/** Replace the owned relations, including removal of obsolete prop values. */
export function reconcileSheetGestureRelations<T>(
  gesture: GestureRelations<T>,
  relations?: { waitFor?: T[], continueWith?: T[], simultaneousWith?: T[] },
): void {
  gesture.waitFor.splice(0)
  gesture.continueWith.splice(0)
  gesture.simultaneousWith.splice(0)
  for (const entry of relations?.waitFor ?? []) {
    appendUnique(gesture.waitFor, entry, gesture.externalWaitFor)
  }
  for (const entry of relations?.continueWith ?? []) {
    appendUnique(gesture.continueWith, entry, gesture.externalContinueWith)
  }
  for (const entry of relations?.simultaneousWith ?? []) {
    appendUnique(gesture.simultaneousWith, entry, gesture.externalSimultaneous)
  }
}

/**
 * Keep both recognizers observing the touch. Consumption selects the owner;
 * failing either recognizer would stop live boundary observations and depend
 * on platform-specific continuation ordering.
 */
export function setupSheetScrollGestureRelations<TGesture>(
  nativeGesture: GestureRelations<TGesture>,
  sheetGesture?: TGesture,
): void {
  reconcileSheetGestureRelations(
    nativeGesture,
    sheetGesture === undefined
      ? undefined
      : { simultaneousWith: [sheetGesture] },
  )
}

/**
 * Parse a getScrollInfo result into an atStart boolean for the given side.
 * Returns undefined when scroll offset fields are absent.
 */
export function parseScrollInfoAtStart(
  resolvedSide: 'top' | 'bottom' | 'left' | 'right',
  info: { scrollX?: number, scrollY?: number },
): boolean | undefined {
  'main thread'
  const isHorizontal = resolvedSide === 'left' || resolvedSide === 'right'
  const offset = isHorizontal ? info.scrollX : info.scrollY
  if (offset === undefined) return undefined
  return offset <= 0
}
