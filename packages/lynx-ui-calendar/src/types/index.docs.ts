// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { ReactNode } from '@lynx-js/react'

import type { ComponentBasicProps } from '@lynx-js/lynx-ui-common'
import type { CSSProperties, ViewProps } from '@lynx-js/types'

export type CalendarDateLike = Date | number | string

export type CalendarWeekdayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6

export type CalendarMonthChangeSource = 'button' | 'select' | 'swipe'

export interface CalendarViewPagerChangeEvent {
  detail: {
    index: number
    isDragged?: boolean
  }
}

export interface CalendarViewPagerProps extends ViewProps {
  /**
   * Selects the specified page during initialization.
   * @defaultValue 0
   * @Android
   * @iOS
   * @Harmony
   */
  'initial-select-index'?: number
  /**
   * Enables horizontal swipe gestures.
   * @defaultValue true
   * @Android
   * @iOS
   * @Harmony
   */
  'enable-scroll'?: boolean
  /**
   * Whether to enable lazy loading based on early exposure.
   * @defaultValue false
   * @Android
   * @iOS
   */
  'keep-item-view'?: boolean
  /**
   * Page change event emitted by the native viewpager.
   * @Android
   * @iOS
   * @Harmony
   */
  bindchange?: (event: CalendarViewPagerChangeEvent) => void
}

export interface CalendarViewPagerItemProps extends ViewProps {}

declare module 'react' {
  // biome-ignore lint/style/noNamespace: Required to extend React JSX intrinsic elements.
  namespace JSX {
    interface IntrinsicElements {
      viewpager: CalendarViewPagerProps
      'viewpager-item': CalendarViewPagerItemProps
    }
  }
}

export interface CalendarDayInfo {
  /**
   * Local date represented by this cell.
   * @Android
   * @iOS
   * @Harmony
   */
  date: Date
  /**
   * Stable local date key in `YYYY-MM-DD` format.
   * @Android
   * @iOS
   * @Harmony
   */
  dateKey: string
  /**
   * Day number shown in the cell.
   * @Android
   * @iOS
   * @Harmony
   */
  day: number
  /**
   * Text label shown by the default day renderer.
   * @Android
   * @iOS
   * @Harmony
   */
  label: string
  /**
   * Month index of the cell date, from 0 for January to 11 for December.
   * @Android
   * @iOS
   * @Harmony
   */
  month: number
  /**
   * Full year of the cell date.
   * @Android
   * @iOS
   * @Harmony
   */
  year: number
  /**
   * Whether the cell belongs to the adjacent previous or next month.
   * @Android
   * @iOS
   * @Harmony
   */
  outside: boolean
  /**
   * Whether the cell is hidden because outside days are disabled.
   * @Android
   * @iOS
   * @Harmony
   */
  hidden: boolean
  /**
   * Whether the cell date is today.
   * @Android
   * @iOS
   * @Harmony
   */
  today: boolean
  /**
   * Whether the cell date is selected.
   * @Android
   * @iOS
   * @Harmony
   */
  selected: boolean
  /**
   * Whether the cell cannot be selected.
   * @Android
   * @iOS
   * @Harmony
   */
  disabled: boolean
  /**
   * Custom data returned by `getDayData`.
   * @Android
   * @iOS
   * @Harmony
   */
  data?: unknown
}

export interface CalendarMonthPage {
  /**
   * First day of the represented month.
   * @Android
   * @iOS
   * @Harmony
   */
  month: Date
  /**
   * Stable month key in `YYYY-MM` format.
   * @Android
   * @iOS
   * @Harmony
   */
  monthKey: string
  /**
   * Offset from the current center month.
   * @Android
   * @iOS
   * @Harmony
   */
  offset: number
  /**
   * Whether this page has its full five-week day grid loaded.
   * @Android
   * @iOS
   * @Harmony
   */
  loaded: boolean
  /**
   * Five-week day grid for this month page. This is empty while a progressive
   * page is still loading.
   * @Android
   * @iOS
   * @Harmony
   */
  days: CalendarDayInfo[]
}

export interface CalendarWeekdayInfo {
  /**
   * Day index, from 0 for Sunday to 6 for Saturday.
   * @Android
   * @iOS
   * @Harmony
   */
  index: CalendarWeekdayIndex
  /**
   * Display label for this weekday.
   * @Android
   * @iOS
   * @Harmony
   */
  label: string
}

export interface CalendarClassNames {
  root?: string
  header?: string
  caption?: string
  navButton?: string
  navButtonPrevious?: string
  navButtonNext?: string
  weekdays?: string
  weekday?: string
  viewPager?: string
  viewPagerItem?: string
  month?: string
  day?: string
  dayText?: string
}

export type CalendarDayStyle =
  | CSSProperties
  | ((day: CalendarDayInfo) => CSSProperties | undefined)

export interface CalendarRenderProps {
  /**
   * First day of the currently visible month.
   * @Android
   * @iOS
   * @Harmony
   */
  month: Date
  /**
   * Stable key for the currently visible month.
   * @Android
   * @iOS
   * @Harmony
   */
  monthKey: string
  /**
   * Currently selected date, or null when no date is selected.
   * @Android
   * @iOS
   * @Harmony
   */
  selectedDate: Date | null
  /**
   * Sliding window of rendered month pages.
   * @Android
   * @iOS
   * @Harmony
   */
  pages: CalendarMonthPage[]
  /**
   * Weekday labels ordered by `weekStartsOn`.
   * @Android
   * @iOS
   * @Harmony
   */
  weekdays: CalendarWeekdayInfo[]
  /**
   * Whether the previous month can be opened.
   * @Android
   * @iOS
   * @Harmony
   */
  canGoPreviousMonth: boolean
  /**
   * Whether the next month can be opened.
   * @Android
   * @iOS
   * @Harmony
   */
  canGoNextMonth: boolean
  /**
   * Opens the previous month.
   * @Android
   * @iOS
   * @Harmony
   */
  goToPreviousMonth: () => void
  /**
   * Opens the next month.
   * @Android
   * @iOS
   * @Harmony
   */
  goToNextMonth: () => void
  /**
   * Selects a day cell.
   * @Android
   * @iOS
   * @Harmony
   */
  selectDay: (day: CalendarDayInfo) => void
}

/**
 * Props for the Calendar component.
 * @zh Calendar 组件属性。
 */
export interface CalendarProps extends ComponentBasicProps {
  /**
   * Controlled selected date.
   * @Android
   * @iOS
   * @Harmony
   */
  value?: CalendarDateLike | null
  /**
   * Initial selected date for uncontrolled usage.
   * @Android
   * @iOS
   * @Harmony
   */
  defaultValue?: CalendarDateLike | null
  /**
   * Triggered when the selected date changes.
   * @Android
   * @iOS
   * @Harmony
   */
  onValueChange?: (value: Date | null, day: CalendarDayInfo) => void
  /**
   * Controlled visible month.
   * @Android
   * @iOS
   * @Harmony
   */
  month?: CalendarDateLike
  /**
   * Initial visible month for uncontrolled usage.
   * @Android
   * @iOS
   * @Harmony
   */
  defaultMonth?: CalendarDateLike
  /**
   * Triggered when the visible month changes.
   * @Android
   * @iOS
   * @Harmony
   */
  onMonthChange?: (month: Date, source: CalendarMonthChangeSource) => void
  /**
   * First weekday of each row. 0 is Sunday and 1 is Monday.
   * @defaultValue 0
   * @Android
   * @iOS
   * @Harmony
   */
  weekStartsOn?: CalendarWeekdayIndex
  /**
   * Whether days from adjacent months should be visible.
   * @defaultValue true
   * @Android
   * @iOS
   * @Harmony
   */
  showOutsideDays?: boolean
  /**
   * Number of month pages kept in the sliding window. Even values are rounded up.
   * @defaultValue 5
   * @Android
   * @iOS
   * @Harmony
   */
  monthWindowSize?: number
  /**
   * Whether month pages should be cached incrementally. When enabled, Calendar
   * loads the current month and adjacent swipe target first, then each one-page
   * navigation adds only the next needed adjacent page.
   * @defaultValue true
   * @Android
   * @iOS
   * @Harmony
   */
  progressiveMonthLoading?: boolean
  /**
   * Earliest selectable date.
   * @Android
   * @iOS
   * @Harmony
   */
  min?: CalendarDateLike
  /**
   * Latest selectable date.
   * @Android
   * @iOS
   * @Harmony
   */
  max?: CalendarDateLike
  /**
   * Disables all date interactions.
   * @defaultValue false
   * @Android
   * @iOS
   * @Harmony
   */
  disabled?: boolean
  /**
   * Returns true when a date should be disabled.
   * @Android
   * @iOS
   * @Harmony
   */
  disabledDate?: (date: Date) => boolean
  /**
   * Returns custom data for a day. It is evaluated only for the rendered
   * sliding-window pages.
   * @Android
   * @iOS
   * @Harmony
   */
  getDayData?: (date: Date) => unknown
  /**
   * Formats the visible month caption.
   * @Android
   * @iOS
   * @Harmony
   */
  formatMonthCaption?: (month: Date) => string
  /**
   * Weekday labels starting from Sunday.
   * @Android
   * @iOS
   * @Harmony
   */
  weekdayLabels?: string[]
  /**
   * Custom weekday cell content.
   * @docTypeFallback (weekday: CalendarWeekdayInfo) => ReactNode
   * @Android
   * @iOS
   * @Harmony
   */
  renderWeekday?: (weekday: CalendarWeekdayInfo) => ReactNode
  /**
   * Custom day cell content.
   * @docTypeFallback (day: CalendarDayInfo) => ReactNode
   * @Android
   * @iOS
   * @Harmony
   */
  renderDay?: (day: CalendarDayInfo) => ReactNode
  /**
   * Static style or per-day style callback applied to each day cell root.
   * @docTypeFallback CSSProperties | ((day: CalendarDayInfo) => CSSProperties | undefined)
   * @Android
   * @iOS
   * @Harmony
   */
  dayStyle?: CalendarDayStyle
  /**
   * Slot class names for the default calendar structure.
   * @Android
   * @iOS
   * @Harmony
   */
  classNames?: CalendarClassNames
  /**
   * Original view props spread onto the root view.
   * @Android
   * @iOS
   * @Harmony
   */
  calendarProps?: ViewProps
  /**
   * Original viewpager props spread onto the native viewpager.
   * @Android
   * @iOS
   * @Harmony
   */
  viewPagerProps?: CalendarViewPagerProps
  /**
   * Root content. When omitted, Calendar renders the default shadcn-inspired
   * header, weekday row, and month grid structure.
   * @docTypeFallback ReactNode
   * @Android
   * @iOS
   * @Harmony
   */
  children?: ReactNode
}

export interface CalendarHeaderProps extends ComponentBasicProps {
  children?: ReactNode
  headerProps?: ViewProps
}

export interface CalendarCaptionProps extends ComponentBasicProps {
  children?: ReactNode
  captionProps?: ViewProps
}

export interface CalendarNavButtonProps extends ComponentBasicProps {
  direction: 'previous' | 'next'
  children?: ReactNode
  buttonProps?: ViewProps
}

export interface CalendarWeekdaysProps extends ComponentBasicProps {
  renderWeekday?: (weekday: CalendarWeekdayInfo) => ReactNode
}

export interface CalendarMonthsProps extends ComponentBasicProps {
  viewPagerProps?: CalendarViewPagerProps
}

export interface CalendarMonthProps extends ComponentBasicProps {
  page: CalendarMonthPage
}
