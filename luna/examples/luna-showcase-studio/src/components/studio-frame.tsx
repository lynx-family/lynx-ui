// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { ComponentPropsWithRef } from 'react'

import { Container } from './container'
import { cn } from '../utils'

type StudioFrameProps = ComponentPropsWithRef<'div'>

function StudioFrame({ children, className, ...restProps }: StudioFrameProps) {
  return (
    <Container
      className={cn(
        'min-h-[240px] min-w-[240px] box-border overflow-hidden pointer-events-none px-4 md:px-10',
        className,
      )}
      {...restProps}
    >
      {children}
    </Container>
  )
}

export { StudioFrame }
