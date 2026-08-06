// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { Tab, TabGroup, TabList } from '@headlessui/react'
import { Columns2, GalleryHorizontalEnd, Grid3x2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { forwardRef } from 'react'
import type { ComponentPropsWithoutRef, ForwardedRef } from 'react'

import { cn } from '../utils'

const TabIcon = forwardRef<HTMLButtonElement, TabIconProps>(
  TabIconImpl,
)

interface MenuBarProps {
  onViewModeChange?: (index: number) => void
  className?: string
  themeMode?: 'light' | 'dark'
}

function MenuBar(
  { onViewModeChange, className, themeMode = 'light' }: MenuBarProps,
) {
  const isLight = themeMode === 'light'
  const containerBgClass = isLight ? 'bg-[#ffffffbb]' : 'bg-[#0000001a]'
  const iconColor = isLight ? '#000000' : '#ffffff'

  return (
    <div
      className={cn(
        'absolute bottom-4 right-4 rounded-full shadow-sm',
        containerBgClass,
        className,
      )}
    >
      <TabGroup
        onChange={onViewModeChange}
      >
        <TabList className='flex md:flex-col justify-between items-center px-3 py-2 md:px-3 md:py-5 gap-4 md:gap-5'>
          <TabIcon
            icon={Columns2}
            color={iconColor}
            aria-label='Compare view'
          />
          <TabIcon
            icon={GalleryHorizontalEnd}
            color={iconColor}
            aria-label='Focus view'
          />
          <TabIcon
            icon={Grid3x2}
            color={iconColor}
            aria-label='Lineup view'
          />
        </TabList>
      </TabGroup>
    </div>
  )
}

type TabIconProps =
  & Omit<ComponentPropsWithoutRef<typeof Tab>, 'className' | 'color'>
  & Omit<ComponentPropsWithoutRef<'div'>, 'children' | 'className' | 'color'>
  & { icon: LucideIcon, className?: string, color?: string }

function TabIconImpl(
  props: TabIconProps,
  ref: ForwardedRef<HTMLButtonElement>,
) {
  const { icon: Icon, className, color, ...restProps } = props

  return (
    <Tab
      ref={ref}
      className={cn(
        'transition-all cursor-pointer rounded-full outline-none focus:outline-none focus-visible:outline-none ui-selected:opacity-100 opacity-50 hover:scale-125',
        className,
      )}
      {...restProps}
    >
      <Icon className='w-4 h-4 md:w-5 md:h-5' color={color} />
    </Tab>
  )
}

export { MenuBar }
