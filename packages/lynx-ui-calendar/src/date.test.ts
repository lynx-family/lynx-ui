// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { describe, expect, it, vi } from 'vitest'

import {
  buildCalendarMonthPlaceholderPage,
  buildCalendarMonthPage,
  formatCalendarDateKey,
  formatCalendarMonthKey,
  getCalendarWeekdays,
  normalizeCalendarDate,
  normalizeCalendarWindowSize,
} from './date'

describe('calendar date utilities', () => {
  it('normalizes date-only strings as local dates', () => {
    const date = normalizeCalendarDate('2026-05-22')

    expect(date?.getFullYear()).toBe(2026)
    expect(date?.getMonth()).toBe(4)
    expect(date?.getDate()).toBe(22)
    expect(formatCalendarDateKey(date as Date)).toBe('2026-05-22')
  })

  it('rounds sliding window size up to an odd number of pages', () => {
    expect(normalizeCalendarWindowSize(undefined)).toBe(5)
    expect(normalizeCalendarWindowSize(1)).toBe(3)
    expect(normalizeCalendarWindowSize(4)).toBe(5)
    expect(normalizeCalendarWindowSize(7)).toBe(7)
  })

  it('orders weekdays from the configured first day', () => {
    expect(getCalendarWeekdays(1).map(day => day.label)).toEqual([
      'Mo',
      'Tu',
      'We',
      'Th',
      'Fr',
      'Sa',
      'Su',
    ])
  })

  it('builds a fixed five-week page and calls data loaders only for that page', () => {
    const getDayData = vi.fn(date => formatCalendarDateKey(date))
    const page = buildCalendarMonthPage({
      month: new Date(2026, 4, 1),
      offset: 0,
      selectedDate: new Date(2026, 4, 22),
      today: new Date(2026, 4, 22),
      weekStartsOn: 0,
      showOutsideDays: true,
      minDate: null,
      maxDate: null,
      getDayData,
    })

    expect(page.days).toHaveLength(35)
    expect(page.loaded).toBe(true)
    expect(page.monthKey).toBe('2026-05')
    expect(formatCalendarMonthKey(page.month)).toBe('2026-05')
    expect(page.days[0].dateKey).toBe('2026-04-26')
    expect(page.days.at(-1)?.dateKey).toBe('2026-05-30')
    expect(page.days.find(day => day.dateKey === '2026-05-22')).toMatchObject({
      selected: true,
      today: true,
      outside: false,
    })
    expect(getDayData).toHaveBeenCalledTimes(35)
  })

  it('builds unloaded placeholder pages without day data', () => {
    const page = buildCalendarMonthPlaceholderPage(new Date(2026, 4, 1), -1)

    expect(page).toMatchObject({
      monthKey: '2026-05',
      offset: -1,
      loaded: false,
      days: [],
    })
  })

  it('hides outside days while preserving stable grid positions', () => {
    const page = buildCalendarMonthPage({
      month: new Date(2026, 4, 1),
      offset: 0,
      selectedDate: null,
      today: new Date(2026, 4, 22),
      weekStartsOn: 0,
      showOutsideDays: false,
      minDate: null,
      maxDate: null,
    })

    expect(page.days[0]).toMatchObject({
      dateKey: '2026-04-26',
      outside: true,
      hidden: true,
      disabled: true,
    })
    expect(page.days.find(day => day.dateKey === '2026-05-01')).toMatchObject({
      hidden: false,
      disabled: false,
    })
  })
})
