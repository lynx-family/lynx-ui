// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { SliderRangeValue } from '@lynx-js/lynx-ui'

export type PriceRange = readonly [number, number]

export interface VehiclePreset {
  label: string
  prices: PriceRange
}

export const MIN_PRICE = 14
export const MAX_PRICE = 140

const PRICE_SPAN = MAX_PRICE - MIN_PRICE

const VEHICLE_PRESETS: readonly VehiclePreset[] = [
  { label: 'Saver', prices: [16, 40] },
  { label: 'Economy', prices: [16, 46] },
  { label: 'Taxi', prices: [18, 60] },
  { label: 'Comfort', prices: [20, 70] },
  { label: 'Business', prices: [80, 120] },
  { label: 'Luxury', prices: [80, 140] },
]

export const VEHICLE_PRESET_ROWS = [
  VEHICLE_PRESETS.slice(0, 2),
  VEHICLE_PRESETS.slice(2, 4),
  VEHICLE_PRESETS.slice(4, 6),
]

function priceToRatio(price: number): number {
  return (price - MIN_PRICE) / PRICE_SPAN
}

export function ratioToPrice(ratio: number): number {
  return Math.round(MIN_PRICE + ratio * PRICE_SPAN)
}

export function toSliderRange(prices: PriceRange): SliderRangeValue {
  return [priceToRatio(prices[0]), priceToRatio(prices[1])]
}

export function formatPriceRange(prices: PriceRange): string {
  return `$${prices[0]}–$${prices[1]}`
}

export const INITIAL_RANGE = toSliderRange(VEHICLE_PRESETS[0].prices)
