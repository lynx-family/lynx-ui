// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type {
  CalendarDateLike,
  CalendarDayInfo,
  CalendarMonthPage,
  CalendarWeekdayIndex,
  CalendarWeekdayInfo,
} from './types'

const DAYS_PER_WEEK = 7
export const DEFAULT_CALENDAR_MONTH_WINDOW_SIZE = 5
export const CALENDAR_DAYS_PER_MONTH_PAGE = 35

const DEFAULT_WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function pad2(value: number): string {
  return value < 10 ? `0${value}` : `${value}`
}

function createLocalDate(year: number, month: number, day = 1): Date {
  return new Date(year, month, day)
}

function parseDateString(value: string): Date | null {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (dateMatch) {
    const [, year, month, day] = dateMatch
    return createLocalDate(Number(year), Number(month) - 1, Number(day))
  }

  const monthMatch = /^(\d{4})-(\d{2})$/.exec(value)
  if (monthMatch) {
    const [, year, month] = monthMatch
    return createLocalDate(Number(year), Number(month) - 1, 1)
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function normalizeCalendarDate(
  value: CalendarDateLike | null | undefined,
): Date | null {
  if (value === null || value === undefined) {
    return null
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime())
      ? null
      : createLocalDate(value.getFullYear(), value.getMonth(), value.getDate())
  }

  if (typeof value === 'number') {
    const date = new Date(value)
    return Number.isNaN(date.getTime())
      ? null
      : createLocalDate(date.getFullYear(), date.getMonth(), date.getDate())
  }

  return parseDateString(value)
}

export function startOfCalendarMonth(
  value: CalendarDateLike | null | undefined,
  fallback = new Date(),
): Date {
  const date = normalizeCalendarDate(value) ?? fallback
  return createLocalDate(date.getFullYear(), date.getMonth(), 1)
}

export function addCalendarMonths(date: Date, offset: number): Date {
  return createLocalDate(date.getFullYear(), date.getMonth() + offset, 1)
}

export function getCalendarMonthIndex(date: Date): number {
  return date.getFullYear() * 12 + date.getMonth()
}

export function formatCalendarDateKey(date: Date): string {
  return [
    date.getFullYear(),
    pad2(date.getMonth() + 1),
    pad2(date.getDate()),
  ].join('-')
}

export function formatCalendarMonthKey(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`
}

function getCalendarDayValue(date: Date): number {
  return date.getFullYear() * 10000
    + (date.getMonth() + 1) * 100
    + date.getDate()
}

export function normalizeCalendarWindowSize(value: number | undefined): number {
  const rounded = Math.max(
    3,
    Math.floor(value ?? DEFAULT_CALENDAR_MONTH_WINDOW_SIZE),
  )
  return rounded % 2 === 0 ? rounded + 1 : rounded
}

export function getCalendarWeekdays(
  weekStartsOn: CalendarWeekdayIndex,
  labels = DEFAULT_WEEKDAY_LABELS,
): CalendarWeekdayInfo[] {
  return Array.from({ length: DAYS_PER_WEEK }, (_, index) => {
    const weekdayIndex = (
      (weekStartsOn + index) % DAYS_PER_WEEK
    ) as CalendarWeekdayIndex
    return {
      index: weekdayIndex,
      label: labels[weekdayIndex] ?? DEFAULT_WEEKDAY_LABELS[weekdayIndex],
    }
  })
}

function isBeforeMin(date: Date, minDate: Date | null): boolean {
  return minDate !== null && getCalendarDayValue(date) < getCalendarDayValue(
        minDate,
      )
}

function isAfterMax(date: Date, maxDate: Date | null): boolean {
  return maxDate !== null && getCalendarDayValue(date) > getCalendarDayValue(
        maxDate,
      )
}

export interface BuildCalendarMonthPageOptions {
  month: Date
  offset: number
  selectedDate: Date | null
  today: Date
  weekStartsOn: CalendarWeekdayIndex
  showOutsideDays: boolean
  minDate: Date | null
  maxDate: Date | null
  disabledDate?: (date: Date) => boolean
  getDayData?: (date: Date) => unknown
  disabled?: boolean
}

export function buildCalendarMonthPlaceholderPage(
  month: Date,
  offset: number,
): CalendarMonthPage {
  const monthStart = startOfCalendarMonth(month)
  return {
    month: monthStart,
    monthKey: formatCalendarMonthKey(monthStart),
    offset,
    loaded: false,
    days: [],
  }
}

export function buildCalendarMonthPage({
  month,
  offset,
  selectedDate,
  today,
  weekStartsOn,
  showOutsideDays,
  minDate,
  maxDate,
  disabledDate,
  getDayData,
  disabled = false,
}: BuildCalendarMonthPageOptions): CalendarMonthPage {
  const monthStart = startOfCalendarMonth(month)
  const firstWeekdayOffset = (
    monthStart.getDay() - weekStartsOn + DAYS_PER_WEEK
  ) % DAYS_PER_WEEK
  const gridStart = createLocalDate(
    monthStart.getFullYear(),
    monthStart.getMonth(),
    1 - firstWeekdayOffset,
  )
  const selectedDateKey = selectedDate
    ? formatCalendarDateKey(selectedDate)
    : null
  const todayKey = formatCalendarDateKey(today)

  const days = Array.from(
    { length: CALENDAR_DAYS_PER_MONTH_PAGE },
    (_, index): CalendarDayInfo => {
      const date = createLocalDate(
        gridStart.getFullYear(),
        gridStart.getMonth(),
        gridStart.getDate() + index,
      )
      const dateKey = formatCalendarDateKey(date)
      const outside = date.getMonth() !== monthStart.getMonth()
      const hidden = outside && !showOutsideDays
      const isDisabled = disabled
        || hidden
        || isBeforeMin(date, minDate)
        || isAfterMax(date, maxDate)
        || Boolean(disabledDate?.(date))

      return {
        date,
        dateKey,
        day: date.getDate(),
        label: `${date.getDate()}`,
        month: date.getMonth(),
        year: date.getFullYear(),
        outside,
        hidden,
        today: dateKey === todayKey,
        selected: dateKey === selectedDateKey,
        disabled: isDisabled,
        data: getDayData?.(date),
      }
    },
  )

  return {
    month: monthStart,
    monthKey: formatCalendarMonthKey(monthStart),
    offset,
    loaded: true,
    days,
  }
}
