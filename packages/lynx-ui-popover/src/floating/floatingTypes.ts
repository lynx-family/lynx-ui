// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { RefObject } from '@lynx-js/react'

import type { NodesRef } from '@lynx-js/types'

export type Axis = 'x' | 'y'

export type Length = 'width' | 'height'

export type Coords = Record<Axis, number>

export type SideObject = Record<Side, number>

export type ElementContext = 'reference' | 'floating'

export type Derivable<T> = (state: MiddlewareState) => T
export type ClientRectObject = Prettify<Rect & SideObject>
export type Prettify<T> =
  & {
    [K in keyof T]: T[K]
  }
  & {}

export type Promisable<T> = T | Promise<T>

export type FindElementBy = string | RefObject<NodesRef>

export type Dimensions = Record<Length, number>
export type Strategy = 'absolute' | 'fixed'

export type Alignment = 'start' | 'end'
export type Side = 'top' | 'right' | 'bottom' | 'left'
export type AlignedPlacement = `${Side}-${Alignment}`
export type Placement = Prettify<Side | AlignedPlacement>

export type Partial<T> = {
  [P in keyof T]?: T[P]
}
export type Padding = number | Prettify<Partial<SideObject>>

export interface DetectOverflowOptions {
  /**
   * The clipping element(s) or area in which overflow will be checked.
   * @default 'clippingAncestors'
   */
  // boundary?: Boundary;
  /**
   * The element in which overflow is being checked relative to a boundary.
   * @default 'floating'
   */
  elementContext?: ElementContext
  /**
   * Whether to check for overflow using the alternate element's boundary
   * (`clippingAncestors` boundary only).
   * @default false
   */
  altBoundary?: boolean
  /**
   * Virtual padding for the resolved overflow detection offsets.
   * @default 0
   */
  padding?: Padding
}

export interface ElementRects {
  alternativeReference?: Rect
  reference: Rect
  floating: Rect
}

export interface ElementInfo extends ElementRects {
  arrow: {
    coords: { x: number | null, y: number | null }
    offset: number
    size: number
  }
  floatingCoords: Coords
  maxContentSize?: MaxSizes
}

export interface MaxSizes {
  maxWidth: `${number}px`
  maxHeight: `${number}px`
}

export interface ShiftOptions extends DetectOverflowOptions {
  /**
   * The axis that runs along the alignment of the floating element. Determines
   * whether overflow along this axis is checked to perform shifting.
   * @default true
   */
  mainAxis?: boolean
  /**
   * The axis that runs along the side of the floating element. Determines
   * whether overflow along this axis is checked to perform shifting.
   * @default false
   */
  crossAxis?: boolean
  /**
   * Accepts a function that limits the shifting done in order to prevent
   * detachment.
   */
  limiter?: {
    fn: (state: MiddlewareState) => Coords
    options?: unknown
  }
}

export interface Elements {
  reference: unknown
  floating: unknown
}

export interface MiddlewareData {
  arrow?: Partial<Coords> & {
    centerOffset: number
    alignmentOffset?: number
  }
  offset?: Coords & { placement: Placement }
  shift?: Coords & {
    enabled: Record<Axis, boolean>
  }
  size?: { availableWidth: number, availableHeight: number }
}

export type Rect = Prettify<Coords & Dimensions>

export interface MiddlewareState extends Coords {
  initialPlacement: Placement
  placement: Placement
  strategy: Strategy
  middlewareData: MiddlewareData
  elements: Elements
  rects: ElementRects
  platform: Platform
}

export interface Platform {
  getElementRects: () => Promisable<ElementRects>
  getClippingRect: (
    element?: FindElementBy,
  ) => Promisable<Rect>
  isRTL?: (element?: unknown) => Promisable<boolean>
  getDimensions: (
    element: 'floating' | 'reference' | 'arrow',
  ) => Promisable<Dimensions>
}

export interface ComputePositionReturn extends Coords {
  /**
   * The final chosen placement of the floating element.
   */
  // placement: Placement;
  /**
   * The strategy used to position the floating element.
   */
  // strategy: Strategy;
  /**
   * Object containing data returned from all middleware, keyed by their name.
   */
  middlewareData: MiddlewareData
}

export interface ComputePositionConfig {
  /**
   * Object to interface with the current platform.
   */
  platform: Platform
  /**
   * Where to place the floating element relative to the reference element.
   */
  placement?: Placement
  /**
   * The strategy to use when positioning the floating element.
   */
  strategy?: Strategy
  /**
   * Array of middleware objects to modify the positioning or provide data for
   * rendering.
   */
  middleware?: Array<Middleware | null | undefined | false>
}

export interface MiddlewareReturn extends Partial<Coords> {
  data?: Record<string, unknown>
  reset?:
    | boolean
    | {
      placement?: Placement
      rects?: boolean | ElementRects
    }
}

export interface Middleware {
  name: string
  options?: unknown
  fn: (state: MiddlewareState) => Promisable<MiddlewareReturn>
}

export type ComputePosition = (
  reference: Rect,
  floating: Rect,
  config: ComputePositionConfig,
) => Promise<ComputePositionReturn>

type OffsetValue =
  | number
  | {
    /**
     * The axis that runs along the side of the floating element. Represents
     * the distance (gutter or margin) between the reference and floating
     * element.
     * @default 0
     */
    mainAxis?: number
    /**
     * The axis that runs along the alignment of the floating element.
     * Represents the skidding between the reference and floating element.
     * @default 0
     */
    crossAxis?: number
    /**
     * The same axis as `crossAxis` but applies only to aligned placements
     * and inverts the `end` alignment. When set to a number, it overrides the
     * `crossAxis` value.
     *
     * A positive number will move the floating element in the direction of
     * the opposite edge to the one that is aligned, while a negative number
     * the reverse.
     * @default null
     */
    alignmentAxis?: number | null
  }

export type OffsetOptions = OffsetValue | Derivable<OffsetValue>

export interface ArrowOptions {
  /**
   * The arrow element to be positioned.
   * @default undefined
   */
  element?: unknown
  /**
   * The padding between the arrow element and the floating element edges.
   * Useful when the floating element has rounded corners.
   * @default 0
   */
  padding?: Padding
}

type LimitShiftOffset =
  | number
  | {
    /**
     * Offset the limiting of the axis that runs along the alignment of the
     * floating element.
     */
    mainAxis?: number
    /**
     * Offset the limiting of the axis that runs along the side of the
     * floating element.
     */
    crossAxis?: number
  }

export interface LimitShiftOptions {
  /**
   * Offset when limiting starts. `0` will limit when the opposite edges of the
   * reference and floating elements are aligned.
   * - positive = start limiting earlier
   * - negative = start limiting later
   */
  offset?: LimitShiftOffset
  /**
   * Whether to limit the axis that runs along the alignment of the floating
   * element.
   */
  mainAxis?: boolean
  /**
   * Whether to limit the axis that runs along the side of the floating element.
   */
  crossAxis?: boolean
}
