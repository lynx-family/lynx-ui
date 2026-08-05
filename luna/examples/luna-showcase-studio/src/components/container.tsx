// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { forwardRef } from 'react'
import type { ComponentPropsWithoutRef } from 'react'

import { cn } from '../utils'

interface ContainerProps {
  column?: boolean
  center?: boolean
}

const Container = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<'div'> & ContainerProps
>(
  (props, ref) => {
    const { className, column, center = false, ...restProps } = props

    return (
      <div
        ref={ref}
        className={cn(
          'size-full flex',
          column ? 'flex-col' : 'flex-row',
          center && 'justify-center items-center',
          className,
        )}
        {...restProps}
      />
    )
  },
)

Container.displayName = 'Container'

export { Container }
