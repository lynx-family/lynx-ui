// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { useEffect, useMemo, useRef, useState } from '@lynx-js/react'
import type { ReactNode } from '@lynx-js/react'

import { invokeByRef, useMemoizedFn } from '@lynx-js/lynx-ui-common'
import { LazyComponent } from '@lynx-js/lynx-ui-lazy-component'
import type { CSSProperties, NodesRef } from '@lynx-js/types'
import { clsx } from 'clsx'

import { CalendarContext, useCalendarContext } from './CalendarContext'
import {
  CALENDAR_DAYS_PER_MONTH_PAGE,
  DEFAULT_CALENDAR_MONTH_WINDOW_SIZE,
  addCalendarMonths,
  buildCalendarMonthPage,
  buildCalendarMonthPlaceholderPage,
  formatCalendarDateKey,
  formatCalendarMonthKey,
  getCalendarMonthIndex,
  getCalendarWeekdays,
  normalizeCalendarDate,
  normalizeCalendarWindowSize,
  startOfCalendarMonth,
} from './date'
import type {
  CalendarCaptionProps,
  CalendarDayInfo,
  CalendarDayStyle,
  CalendarHeaderProps,
  CalendarMonthChangeSource,
  CalendarMonthPage,
  CalendarMonthProps,
  CalendarMonthsProps,
  CalendarNavButtonProps,
  CalendarProps,
  CalendarRenderProps,
  CalendarViewPagerChangeEvent,
  CalendarWeekdaysProps,
} from './types'

const DEFAULT_MONTH_CAPTION_LABELS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]
const DEFAULT_MONTH_CAPTION_FORMATTER = (month: Date): string =>
  `${DEFAULT_MONTH_CAPTION_LABELS[month.getMonth()]} ${month.getFullYear()}`
const CALENDAR_LAZY_MONTH_ESTIMATED_STYLE: CSSProperties = {
  width: '100%',
  height: '100%',
}

type CalendarCachedMonthPage = Omit<CalendarMonthPage, 'offset'>

interface CalendarPageCacheState {
  key: string
  pagesByMonthKey: Record<string, CalendarCachedMonthPage>
}

function objectStyle(style: string | CSSProperties | undefined): CSSProperties {
  return typeof style === 'string' || style === undefined ? {} : style
}

function resolveCalendarDayStyle(
  dayStyle: CalendarDayStyle | undefined,
  day: CalendarDayInfo,
): CSSProperties | undefined {
  return typeof dayStyle === 'function' ? dayStyle(day) : dayStyle
}

function canMoveToMonth(
  month: Date,
  minDate: Date | null,
  maxDate: Date | null,
): boolean {
  const monthIndex = getCalendarMonthIndex(month)
  const minMonthIndex = minDate === null
    ? Number.NEGATIVE_INFINITY
    : getCalendarMonthIndex(minDate)
  const maxMonthIndex = maxDate === null
    ? Number.POSITIVE_INFINITY
    : getCalendarMonthIndex(maxDate)

  return monthIndex >= minMonthIndex && monthIndex <= maxMonthIndex
}

function getWindowOffsets(
  centerPageIndex: number,
  windowSize: number,
): number[] {
  return Array.from(
    { length: windowSize },
    (_, index) => index - centerPageIndex,
  )
}

function getInitialLoadedOffsets(
  centerPageIndex: number,
  windowSize: number,
  progressive: boolean,
): number[] {
  if (!progressive) {
    return getWindowOffsets(centerPageIndex, windowSize)
  }

  const offsets = [0]
  if (centerPageIndex > 0) {
    offsets.push(-1)
  }
  if (centerPageIndex < windowSize - 1) {
    offsets.push(1)
  }

  return offsets
}

function toCachedMonthPage(page: CalendarMonthPage): CalendarCachedMonthPage {
  const { offset: _offset, ...cachedPage } = page
  return cachedPage
}

function applyRuntimeDayState(
  page: CalendarCachedMonthPage,
  offset: number,
  selectedDateKey: string | null,
  todayKey: string,
): CalendarMonthPage {
  return {
    ...page,
    offset,
    days: page.days.map((day) => {
      const selected = day.dateKey === selectedDateKey
      const today = day.dateKey === todayKey
      if (day.selected === selected && day.today === today) {
        return day
      }

      return {
        ...day,
        selected,
        today,
      }
    }),
  }
}

export function Calendar({
  value,
  defaultValue = null,
  onValueChange,
  month,
  defaultMonth,
  onMonthChange,
  weekStartsOn = 0,
  showOutsideDays = true,
  monthWindowSize = DEFAULT_CALENDAR_MONTH_WINDOW_SIZE,
  progressiveMonthLoading = true,
  min,
  max,
  disabled = false,
  disabledDate,
  getDayData,
  formatMonthCaption = DEFAULT_MONTH_CAPTION_FORMATTER,
  weekdayLabels,
  renderWeekday,
  renderDay,
  dayStyle,
  classNames,
  calendarProps,
  viewPagerProps,
  className,
  style,
  children,
}: CalendarProps): ReactNode {
  const initialSelectedDate = useMemo(
    () => normalizeCalendarDate(defaultValue),
    [],
  )
  const isValueControlled = value !== undefined
  const [uncontrolledValue, setUncontrolledValue] = useState<Date | null>(
    initialSelectedDate,
  )
  const selectedDate = isValueControlled
    ? normalizeCalendarDate(value)
    : uncontrolledValue

  const initialMonth = useMemo(
    () => startOfCalendarMonth(defaultMonth ?? defaultValue, new Date()),
    [],
  )
  const isMonthControlled = month !== undefined
  const [uncontrolledMonth, setUncontrolledMonth] = useState<Date>(
    initialMonth,
  )
  const actualMonth = isMonthControlled
    ? startOfCalendarMonth(month, uncontrolledMonth)
    : uncontrolledMonth

  const minDate = useMemo(() => normalizeCalendarDate(min), [min])
  const maxDate = useMemo(() => normalizeCalendarDate(max), [max])
  const normalizedWindowSize = normalizeCalendarWindowSize(monthWindowSize)
  const centerPageIndex = Math.floor(normalizedWindowSize / 2)
  const currentMonthKey = formatCalendarMonthKey(actualMonth)
  const viewPagerRef = useRef<NodesRef>(null)
  const pendingMonthChangeRef = useRef<
    {
      index: number
      source: CalendarMonthChangeSource
    } | null
  >(null)
  const [pagerResetCount, setPagerResetCount] = useState(0)
  const currentMonthIndex = getCalendarMonthIndex(actualMonth)
  const pageCacheKey = [
    normalizedWindowSize,
    weekStartsOn,
    showOutsideDays ? 1 : 0,
    minDate ? formatCalendarDateKey(minDate) : '',
    maxDate ? formatCalendarDateKey(maxDate) : '',
    disabled ? 1 : 0,
  ].join('|')
  const windowOffsets = useMemo(
    () => getWindowOffsets(centerPageIndex, normalizedWindowSize),
    [centerPageIndex, normalizedWindowSize],
  )
  const initialLoadedOffsets = useMemo(
    () =>
      getInitialLoadedOffsets(
        centerPageIndex,
        normalizedWindowSize,
        progressiveMonthLoading,
      ),
    [centerPageIndex, normalizedWindowSize, progressiveMonthLoading],
  )
  const buildCachedMonthPage = useMemoizedFn((
    pageMonth: Date,
  ): CalendarCachedMonthPage => {
    return toCachedMonthPage(buildCalendarMonthPage({
      month: pageMonth,
      offset: 0,
      selectedDate: null,
      today: new Date(),
      weekStartsOn,
      showOutsideDays,
      minDate,
      maxDate,
      disabledDate,
      getDayData,
      disabled,
    }))
  })
  const buildPageCacheState = useMemoizedFn((
    baseMonth: Date,
    offsets: number[],
  ): CalendarPageCacheState => {
    const pagesByMonthKey: Record<string, CalendarCachedMonthPage> = {}
    for (const offset of offsets) {
      const pageMonth = addCalendarMonths(baseMonth, offset)
      pagesByMonthKey[formatCalendarMonthKey(pageMonth)] = buildCachedMonthPage(
        pageMonth,
      )
    }

    return {
      key: pageCacheKey,
      pagesByMonthKey,
    }
  })
  const [pageCacheState, setPageCacheState] = useState<CalendarPageCacheState>(
    () => buildPageCacheState(actualMonth, initialLoadedOffsets),
  )
  const previousMonthIndexRef = useRef(currentMonthIndex)

  useEffect(() => {
    const previousMonthIndex = previousMonthIndexRef.current
    const navigationDelta = currentMonthIndex - previousMonthIndex
    previousMonthIndexRef.current = currentMonthIndex
    let loadedOffsets = windowOffsets
    if (progressiveMonthLoading) {
      loadedOffsets = Math.abs(navigationDelta) === 1
        ? [0, navigationDelta > 0 ? 1 : -1]
        : initialLoadedOffsets
    }
    const windowMonthKeys = new Set(
      windowOffsets.map(offset =>
        formatCalendarMonthKey(addCalendarMonths(actualMonth, offset))
      ),
    )

    setPageCacheState((current) => {
      if (current.key !== pageCacheKey) {
        return buildPageCacheState(actualMonth, initialLoadedOffsets)
      }

      let changed = false
      const nextPagesByMonthKey: Record<string, CalendarCachedMonthPage> = {}
      for (const [monthKey, page] of Object.entries(current.pagesByMonthKey)) {
        if (windowMonthKeys.has(monthKey)) {
          nextPagesByMonthKey[monthKey] = page
        } else {
          changed = true
        }
      }

      for (const offset of loadedOffsets) {
        const pageMonth = addCalendarMonths(actualMonth, offset)
        const monthKey = formatCalendarMonthKey(pageMonth)
        if (!nextPagesByMonthKey[monthKey]) {
          nextPagesByMonthKey[monthKey] = buildCachedMonthPage(pageMonth)
          changed = true
        }
      }

      return changed
        ? {
          key: pageCacheKey,
          pagesByMonthKey: nextPagesByMonthKey,
        }
        : current
    })
  }, [
    actualMonth,
    buildCachedMonthPage,
    buildPageCacheState,
    currentMonthIndex,
    initialLoadedOffsets,
    pageCacheKey,
    progressiveMonthLoading,
    windowOffsets,
  ])

  const setVisibleMonth = useMemoizedFn((
    nextMonth: Date,
    source: CalendarMonthChangeSource,
  ) => {
    const normalizedMonth = startOfCalendarMonth(nextMonth)
    if (!canMoveToMonth(normalizedMonth, minDate, maxDate)) {
      setPagerResetCount(count => count + 1)
      return
    }

    if (!isMonthControlled) {
      setUncontrolledMonth(normalizedMonth)
    }
    onMonthChange?.(normalizedMonth, source)
  })

  const selectViewPagerPage = useMemoizedFn((
    index: number,
    nextMonth: Date,
    source: CalendarMonthChangeSource,
  ) => {
    pendingMonthChangeRef.current = { index, source }
    void invokeByRef(viewPagerRef, 'selectTab', {
      index,
      smooth: true,
    }).catch(() => {
      pendingMonthChangeRef.current = null
      setVisibleMonth(nextMonth, source)
    })
  })

  const goToPreviousMonth = useMemoizedFn(() => {
    const nextMonth = addCalendarMonths(actualMonth, -1)
    if (!canMoveToMonth(nextMonth, minDate, maxDate)) {
      setVisibleMonth(nextMonth, 'button')
      return
    }

    selectViewPagerPage(centerPageIndex - 1, nextMonth, 'button')
  })

  const goToNextMonth = useMemoizedFn(() => {
    const nextMonth = addCalendarMonths(actualMonth, 1)
    if (!canMoveToMonth(nextMonth, minDate, maxDate)) {
      setVisibleMonth(nextMonth, 'button')
      return
    }

    selectViewPagerPage(centerPageIndex + 1, nextMonth, 'button')
  })

  const selectDay = useMemoizedFn((day: CalendarDayInfo) => {
    if (day.disabled || day.hidden) {
      return
    }

    if (!isValueControlled) {
      setUncontrolledValue(day.date)
    }
    onValueChange?.(day.date, day)

    if (day.outside) {
      const monthDelta = getCalendarMonthIndex(day.date) - currentMonthIndex
      if (monthDelta !== 0) {
        selectViewPagerPage(centerPageIndex + monthDelta, day.date, 'select')
      }
    }
  })

  const pages = useMemo(() => {
    const today = new Date()
    const selectedDateKey = selectedDate
      ? formatCalendarDateKey(selectedDate)
      : null
    const todayKey = formatCalendarDateKey(today)
    return windowOffsets.map((offset) => {
      const pageMonth = addCalendarMonths(actualMonth, offset)
      const monthKey = formatCalendarMonthKey(pageMonth)
      const cachedPage = pageCacheState.key === pageCacheKey
        ? pageCacheState.pagesByMonthKey[monthKey]
        : undefined
      return cachedPage
        ? applyRuntimeDayState(cachedPage, offset, selectedDateKey, todayKey)
        : buildCalendarMonthPlaceholderPage(pageMonth, offset)
    })
  }, [
    actualMonth,
    pageCacheKey,
    pageCacheState,
    selectedDate,
    windowOffsets,
  ])

  const weekdays = useMemo(
    () => getCalendarWeekdays(weekStartsOn, weekdayLabels),
    [weekdayLabels, weekStartsOn],
  )

  const onViewPagerChange = useMemoizedFn((
    event: CalendarViewPagerChangeEvent,
  ) => {
    viewPagerProps?.bindchange?.(event)
    const delta = event.detail.index - centerPageIndex
    if (delta === 0) {
      return
    }

    const pendingMonthChange = pendingMonthChangeRef.current
    pendingMonthChangeRef.current = null
    setVisibleMonth(
      addCalendarMonths(actualMonth, delta),
      pendingMonthChange?.index === event.detail.index
        ? pendingMonthChange.source
        : 'swipe',
    )
  })

  const renderProps: CalendarRenderProps = useMemo(() => ({
    month: actualMonth,
    monthKey: currentMonthKey,
    selectedDate,
    pages,
    weekdays,
    canGoPreviousMonth: canMoveToMonth(
      addCalendarMonths(actualMonth, -1),
      minDate,
      maxDate,
    ),
    canGoNextMonth: canMoveToMonth(
      addCalendarMonths(actualMonth, 1),
      minDate,
      maxDate,
    ),
    goToPreviousMonth,
    goToNextMonth,
    selectDay,
  }), [
    actualMonth,
    currentMonthKey,
    goToNextMonth,
    goToPreviousMonth,
    maxDate,
    minDate,
    pages,
    selectedDate,
    selectDay,
    weekdays,
  ])

  const contextValue = useMemo(() => ({
    ...renderProps,
    centerPageIndex,
    pagerKey: `${currentMonthKey}-${pagerResetCount}`,
    viewPagerRef,
    classNames,
    viewPagerProps,
    renderDay,
    dayStyle,
    formatMonthCaption,
    onViewPagerChange,
  }), [
    centerPageIndex,
    classNames,
    currentMonthKey,
    formatMonthCaption,
    onViewPagerChange,
    pagerResetCount,
    dayStyle,
    renderDay,
    renderProps,
    viewPagerRef,
    viewPagerProps,
  ])

  return (
    <CalendarContext.Provider value={contextValue}>
      <view
        style={style}
        className={clsx(className, classNames?.root)}
        {...calendarProps}
      >
        {children ?? (
          <>
            <CalendarHeader />
            <CalendarWeekdays renderWeekday={renderWeekday} />
            <CalendarMonths />
          </>
        )}
      </view>
    </CalendarContext.Provider>
  )
}

export function CalendarHeader({
  children,
  className,
  style,
  headerProps,
}: CalendarHeaderProps): ReactNode {
  const { classNames } = useCalendarContext()

  return (
    <view
      style={style}
      className={clsx(className, classNames?.header)}
      {...headerProps}
    >
      {children ?? (
        <>
          <CalendarNavButton direction='previous' />
          <CalendarCaption />
          <CalendarNavButton direction='next' />
        </>
      )}
    </view>
  )
}

export function CalendarCaption({
  children,
  className,
  style,
  captionProps,
}: CalendarCaptionProps): ReactNode {
  const context = useCalendarContext()

  return (
    <view
      style={style}
      className={clsx(className, context.classNames?.caption)}
      {...captionProps}
    >
      {children ?? <text>{context.formatMonthCaption(context.month)}</text>}
    </view>
  )
}

export function CalendarNavButton({
  direction,
  children,
  className,
  style,
  buttonProps,
}: CalendarNavButtonProps): ReactNode {
  const {
    classNames,
    canGoPreviousMonth,
    canGoNextMonth,
    goToPreviousMonth,
    goToNextMonth,
  } = useCalendarContext()
  const isPrevious = direction === 'previous'
  const isDisabled = isPrevious ? !canGoPreviousMonth : !canGoNextMonth
  const handleTap = useMemoizedFn(() => {
    if (isDisabled) {
      return
    }

    if (isPrevious) {
      goToPreviousMonth()
      return
    }

    goToNextMonth()
  })

  return (
    <view
      bindtap={handleTap}
      event-through={false}
      style={style}
      className={clsx(
        className,
        classNames?.navButton,
        { 'ui-disabled': isDisabled },
        isPrevious
          ? classNames?.navButtonPrevious
          : classNames?.navButtonNext,
      )}
      {...buttonProps}
    >
      {children ?? <text>{isPrevious ? '<' : '>'}</text>}
    </view>
  )
}

export function CalendarWeekdays({
  renderWeekday,
  className,
  style,
}: CalendarWeekdaysProps): ReactNode {
  const { weekdays, classNames } = useCalendarContext()

  return (
    <view
      style={style}
      className={clsx(className, classNames?.weekdays)}
    >
      {weekdays.map((weekday, weekdayIndex) => (
        <view
          key={weekdayIndex}
          className={classNames?.weekday}
        >
          {renderWeekday?.(weekday)}
        </view>
      ))}
    </view>
  )
}

export function CalendarMonths({
  className,
  style,
  viewPagerProps: viewPagerPropsProp,
}: CalendarMonthsProps): ReactNode {
  const {
    pages,
    centerPageIndex,
    pagerKey,
    viewPagerRef,
    classNames,
    viewPagerProps,
    onViewPagerChange,
  } = useCalendarContext()
  const mergedViewPagerProps = viewPagerPropsProp ?? viewPagerProps
  const {
    bindchange: _bindchange,
    className: viewPagerClassName,
    style: viewPagerStyle,
    ...restViewPagerProps
  } = mergedViewPagerProps ?? {}

  return (
    <viewpager
      key={pagerKey}
      ref={viewPagerRef}
      {...restViewPagerProps}
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'row',
        ...objectStyle(viewPagerStyle),
        ...style,
      }}
      className={clsx(className, classNames?.viewPager, viewPagerClassName)}
      initial-select-index={centerPageIndex}
      bindchange={onViewPagerChange}
    >
      {pages.map((page, pageIndex) => {
        const month = <CalendarMonth page={page} />
        return (
          <viewpager-item
            key={pageIndex}
            style={{
              width: '100%',
              flexShrink: 0,
            }}
            className={classNames?.viewPagerItem}
          >
            {pageIndex === centerPageIndex
              ? month
              : (
                <LazyComponent
                  scene={`${pageIndex}`}
                  pid={`calendar-month-${pageIndex}`}
                  estimatedStyle={CALENDAR_LAZY_MONTH_ESTIMATED_STYLE}
                  top='0px'
                  bottom='0px'
                  left='0px'
                  right='0px'
                  unmountOnExit
                >
                  {month}
                </LazyComponent>
              )}
          </viewpager-item>
        )
      })}
    </viewpager>
  )
}

export function CalendarMonth({
  page,
  className,
  style,
}: CalendarMonthProps): ReactNode {
  const { classNames, dayStyle, renderDay, selectDay } = useCalendarContext()
  const handleDayTap = useMemoizedFn((day: CalendarDayInfo) => {
    if (day.disabled) {
      return
    }

    selectDay(day)
  })
  const monthClassName = clsx(
    className,
    classNames?.month,
    { 'ui-loading': !page.loaded },
  )

  if (!page.loaded) {
    return (
      <view
        style={style}
        className={monthClassName}
      >
        {Array.from(
          { length: CALENDAR_DAYS_PER_MONTH_PAGE },
          (_, dayIndex) => (
            <view
              key={dayIndex}
              className={classNames?.day}
            />
          ),
        )}
      </view>
    )
  }

  return (
    <view
      style={style}
      className={monthClassName}
    >
      {page.days.map((day, dayIndex) => (
        <view
          key={dayIndex}
          catchtap={() => handleDayTap(day)}
          event-through={false}
          style={resolveCalendarDayStyle(dayStyle, day)}
          className={clsx(classNames?.day, {
            'ui-selected': day.selected,
            'ui-today': day.today,
            'ui-outside': day.outside,
            'ui-hidden': day.hidden,
            'ui-disabled': day.disabled,
          })}
        >
          {renderDay?.(day) ?? (
            <text className={classNames?.dayText}>
              {day.hidden ? '' : day.label}
            </text>
          )}
        </view>
      ))}
    </view>
  )
}
