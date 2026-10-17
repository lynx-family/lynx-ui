// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { createContext, useContext } from '@lynx-js/react'
import type { ReactNode, RefObject } from '@lynx-js/react'

import { noop } from '@lynx-js/lynx-ui-common'
import type { NodesRef } from '@lynx-js/types'

import type {
  CalendarClassNames,
  CalendarDayInfo,
  CalendarDayStyle,
  CalendarMonthPage,
  CalendarRenderProps,
  CalendarViewPagerChangeEvent,
  CalendarViewPagerProps,
  CalendarWeekdayInfo,
} from './types'

export interface CalendarContextValue extends CalendarRenderProps {
  centerPageIndex: number
  pagerKey: string
  viewPagerRef: RefObject<NodesRef>
  classNames?: CalendarClassNames
  viewPagerProps?: CalendarViewPagerProps
  renderDay?: (day: CalendarDayInfo) => ReactNode
  dayStyle?: CalendarDayStyle
  formatMonthCaption: (month: Date) => string
  onViewPagerChange: (event: CalendarViewPagerChangeEvent) => void
}

const emptyViewPagerRef: RefObject<NodesRef> = { current: null }

const CalendarContext = createContext<CalendarContextValue>({
  month: new Date(1970, 0, 1),
  monthKey: '1970-01',
  selectedDate: null,
  pages: [] satisfies CalendarMonthPage[],
  weekdays: [] satisfies CalendarWeekdayInfo[],
  centerPageIndex: 1,
  pagerKey: '1970-01-0',
  viewPagerRef: emptyViewPagerRef,
  canGoPreviousMonth: true,
  canGoNextMonth: true,
  goToPreviousMonth: noop,
  goToNextMonth: noop,
  selectDay: noop,
  formatMonthCaption: () => '',
  onViewPagerChange: noop,
})

export function useCalendarContext(): CalendarContextValue {
  return useContext(CalendarContext)
}

export { CalendarContext }
