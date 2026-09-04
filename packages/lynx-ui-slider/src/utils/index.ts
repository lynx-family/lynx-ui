// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { SliderRangeValue, SliderThumbIndex, SliderValue } from '../types'

export interface SliderIndicatorGeometry {
  offset: number
  size: number
}

export interface SliderDragResolution<Value extends SliderValue = SliderValue> {
  value: Value
  dragStartValue: Value
  activeThumbIndex: SliderThumbIndex
  startedCollapsed: boolean
}

export interface SliderDragOptions {
  activeThumbIndex?: SliderThumbIndex
  preferredThumbIndex?: SliderThumbIndex
  startedCollapsed?: boolean
  step?: number
}

const SLIDER_VALUE_EPSILON = 1e-12

export const clamp01 = (value: number): number => {
  if (!Number.isFinite(value)) return 0
  return Math.min(Math.max(value, 0), 1)
}

export const getVisualRatio = (value: number, enableRTL: boolean): number => {
  return enableRTL ? 1 - value : value
}

export const snapToStep = (value: number, step: number | undefined): number => {
  if (step === undefined || !Number.isFinite(step) || step <= 0) return value
  const snapped = Math.round(value / step) * step
  const decimalCount = (step.toString().split('.')[1] || '').length
  return clamp01(Number.parseFloat(snapped.toFixed(decimalCount)))
}

export const isSliderRangeValue = (
  value: unknown,
): value is SliderRangeValue => {
  return Array.isArray(value)
    && value.length === 2
    && typeof value[0] === 'number'
    && typeof value[1] === 'number'
}

export const cloneSliderValue = <Value extends SliderValue>(
  value: Value,
): Value => {
  return (isSliderRangeValue(value) ? [value[0], value[1]] : value) as Value
}

export const normalizeSliderRangeValue = (
  value: SliderRangeValue,
  step?: number,
): SliderRangeValue => {
  const first = snapToStep(clamp01(value[0]), step)
  const second = snapToStep(clamp01(value[1]), step)

  return first <= second ? [first, second] : [second, first]
}

export const isSliderValueCollapsed = (value: SliderValue): boolean => {
  if (!isSliderRangeValue(value)) return false

  const [lower, upper] = normalizeSliderRangeValue(value)
  return Math.abs(upper - lower) <= SLIDER_VALUE_EPSILON
}

export function normalizeSliderValue(value: number, step?: number): number
export function normalizeSliderValue(
  value: SliderRangeValue,
  step?: number,
): SliderRangeValue
export function normalizeSliderValue(
  value: SliderValue,
  step?: number,
): SliderValue
export function normalizeSliderValue(
  value: SliderValue,
  step?: number,
): SliderValue {
  if (isSliderRangeValue(value)) {
    return normalizeSliderRangeValue(value, step)
  }

  return snapToStep(clamp01(value), step)
}

export const areSliderValuesEqual = (
  first: SliderValue,
  second: SliderValue,
): boolean => {
  const firstIsRange = isSliderRangeValue(first)
  const secondIsRange = isSliderRangeValue(second)

  if (firstIsRange !== secondIsRange) return false
  if (!firstIsRange || !secondIsRange) return first === second

  return first[0] === second[0] && first[1] === second[1]
}

export const getSliderThumbValue = (
  value: SliderValue,
  index: SliderThumbIndex = 0,
): number => {
  return isSliderRangeValue(value) ? value[index] : value
}

export const getInitialSliderThumbIndex = (
  value: SliderValue,
  requestedIndex: SliderThumbIndex | null,
): SliderThumbIndex | null => {
  if (!isSliderRangeValue(value)) return 0
  return requestedIndex
}

export const getClosestSliderThumbIndex = (
  value: SliderValue,
  targetValue: number,
  preferredIndex?: SliderThumbIndex,
): SliderThumbIndex => {
  if (!isSliderRangeValue(value)) return 0

  const [lower, upper] = normalizeSliderRangeValue(value)
  const target = clamp01(targetValue)

  if (lower === upper) {
    if (target < lower) return 0
    if (target > upper) return 1
    return preferredIndex ?? 0
  }

  const lowerDistance = Math.abs(target - lower)
  const upperDistance = Math.abs(target - upper)

  if (Math.abs(lowerDistance - upperDistance) <= SLIDER_VALUE_EPSILON) {
    return preferredIndex ?? 0
  }
  if (lowerDistance < upperDistance) return 0
  return 1
}

export const getDraggedSliderThumbIndex = (
  value: SliderValue,
  targetValue: number,
  activeIndex?: SliderThumbIndex,
  preferredIndex?: SliderThumbIndex,
  allowCollapsedDirectionChange = false,
): SliderThumbIndex => {
  if (!isSliderRangeValue(value)) return 0

  const [lower, upper] = normalizeSliderRangeValue(value)
  const target = clamp01(targetValue)
  const movedAway = Math.abs(target - lower) > SLIDER_VALUE_EPSILON

  if (
    allowCollapsedDirectionChange
    && isSliderValueCollapsed([lower, upper])
    && movedAway
  ) {
    return target < lower ? 0 : 1
  }

  return activeIndex
    ?? getClosestSliderThumbIndex(value, target, preferredIndex)
}

export function updateSliderValue(
  value: number,
  index: SliderThumbIndex,
  nextValue: number,
  step?: number,
): number
export function updateSliderValue(
  value: SliderRangeValue,
  index: SliderThumbIndex,
  nextValue: number,
  step?: number,
): SliderRangeValue
export function updateSliderValue(
  value: SliderValue,
  index: SliderThumbIndex,
  nextValue: number,
  step?: number,
): SliderValue
export function updateSliderValue(
  value: SliderValue,
  index: SliderThumbIndex,
  nextValue: number,
  step?: number,
): SliderValue {
  if (!isSliderRangeValue(value)) {
    return normalizeSliderValue(nextValue, step)
  }

  const [lower, upper] = normalizeSliderRangeValue(value, step)
  const next = snapToStep(clamp01(nextValue), step)

  // Keep lower/upper thumb identity stable. The active thumb may meet the
  // other thumb, but it never crosses, swaps with, or pushes that thumb.
  if (index === 0) {
    return [Math.min(next, upper), upper]
  }

  return [lower, Math.max(next, lower)]
}

export function resolveSliderDrag(
  value: number,
  targetValue: number,
  options?: SliderDragOptions,
): SliderDragResolution<number>
export function resolveSliderDrag(
  value: SliderRangeValue,
  targetValue: number,
  options?: SliderDragOptions,
): SliderDragResolution<SliderRangeValue>
export function resolveSliderDrag(
  value: SliderValue,
  targetValue: number,
  options?: SliderDragOptions,
): SliderDragResolution
export function resolveSliderDrag(
  value: SliderValue,
  targetValue: number,
  options: SliderDragOptions = {},
): SliderDragResolution {
  const activeThumbIndex = getDraggedSliderThumbIndex(
    value,
    targetValue,
    options.activeThumbIndex,
    options.preferredThumbIndex,
    options.startedCollapsed,
  )
  const nextValue = updateSliderValue(
    value,
    activeThumbIndex,
    targetValue,
    options.step,
  )

  return {
    value: nextValue,
    // Preserve the single-value callback contract from before range support:
    // drag start reports pointer progress before step snapping.
    dragStartValue: isSliderRangeValue(nextValue)
      ? nextValue
      : clamp01(targetValue),
    activeThumbIndex,
    startedCollapsed: isSliderRangeValue(nextValue)
      && isSliderValueCollapsed(nextValue)
      && options.startedCollapsed === true,
  }
}

export const getSliderIndicatorGeometry = (
  value: SliderValue,
): SliderIndicatorGeometry => {
  if (isSliderRangeValue(value)) {
    const [lower, upper] = normalizeSliderRangeValue(value)
    return {
      offset: lower,
      size: Number.parseFloat((upper - lower).toFixed(12)),
    }
  }

  return {
    offset: 0,
    size: clamp01(value),
  }
}

export const getTouchX = (event: unknown): number => {
  const detail =
    typeof event === 'object' && event !== null && 'detail' in event
      ? event.detail
      : undefined
  const x = typeof detail === 'object' && detail !== null && 'x' in detail
    ? detail.x
    : undefined
  return Number(x)
}
