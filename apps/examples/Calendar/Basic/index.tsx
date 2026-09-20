// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useState } from '@lynx-js/react'

import { Calendar } from '@lynx-js/lynx-ui'

import './index.css'

interface CalendarExampleDay {
  label: string
  hidden: boolean
}

interface CalendarExampleWeekday {
  label: string
}

const selectedInitialDate = new Date(2026, 4, 22)

function toDateKey(date: Date): string {
  const month = date.getMonth() + 1
  const day = date.getDate()
  return [
    date.getFullYear(),
    month < 10 ? `0${month}` : `${month}`,
    day < 10 ? `0${day}` : `${day}`,
  ].join('-')
}

function App() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    selectedInitialDate,
  )
  const [visibleMonth, setVisibleMonth] = useState<Date>(
    selectedInitialDate,
  )

  return (
    <view className='demo-container lunaris-dark luna-gradient-rose'>
      <view className='demo-shell'>
        <view className='summary-bar'>
          <view>
            <text className='eyebrow'>Selected</text>
            <text className='summary-value'>
              {selectedDate ? toDateKey(selectedDate) : 'None'}
            </text>
          </view>
          <view className='summary-pill'>
            <text className='summary-pill-text'>
              Swipe months
            </text>
          </view>
        </view>

        <Calendar
          value={selectedDate}
          month={visibleMonth}
          onValueChange={(nextDate: Date | null) => {
            setSelectedDate(nextDate)
          }}
          onMonthChange={setVisibleMonth}
          weekStartsOn={0}
          monthWindowSize={5}
          className='calendar'
          classNames={{
            header: 'calendar-header',
            caption: 'calendar-caption',
            navButton: 'calendar-nav',
            weekdays: 'calendar-weekdays',
            weekday: 'calendar-weekday',
            viewPager: 'calendar-pager',
            viewPagerItem: 'calendar-pager-item',
            month: 'calendar-month',
            day: 'calendar-day',
            dayText: 'calendar-day-text',
          }}
          renderWeekday={(weekday: CalendarExampleWeekday) => (
            <text>{weekday.label}</text>
          )}
          renderDay={(day: CalendarExampleDay) => (
            <text className='calendar-day-number'>
              {day.hidden ? '' : day.label}
            </text>
          )}
        />
      </view>
    </view>
  )
}

root.render(<App />)

export default App
