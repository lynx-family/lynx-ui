// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type {
  MotionNodeLayoutOptions,
  MotionNodeOptions,
  MotionValue,
  SpringOptions,
} from 'motion/react'
import type { ComponentPropsWithoutRef } from 'react'

import type { StageBaseProps } from '../../types/stage-props'

export type MotionStageContainerProps =
  & Omit<MotionNodeOptions, 'transformTemplate'>
  & ComponentPropsWithoutRef<'div'>
  & { layoutId: string }

export type MotionPresentationProps =
  & Omit<MotionNodeOptions, keyof MotionNodeLayoutOptions>
  & ComponentPropsWithoutRef<'div'>

export type MotionStageProps =
  & StageBaseProps
  & {
    /**
     * Motion value for the target viewport width in pixels.
     *
     * When omitted, it uses the visual size from `VisualSizeProvider` if present,
     * otherwise falls back to the base outline width.
     */
    width?: MotionValue<number>
    /**
     * Motion value for the target viewport height in pixels.
     *
     * When omitted, it uses the visual size from `VisualSizeProvider` if present,
     * otherwise falls back to the base outline height.
     */
    height?: MotionValue<number>
    /**
     * Continuous interpolation between `contain` and `cover`.
     *
     * - `0`: behave like `contain`
     * - `1`: behave like `cover`
     */
    fitProgress?: number
    /**
     * 3D translation applied in world space.
     *
     * When `focalLength` is provided, `z` affects perspective scaling.
     */
    world?: { x?: number, y?: number, z?: number }
    /**
     * Spring settings for the fit interpolation (`fit` / `fitProgress`).
     * Controls how the scale transitions between contain and cover.
     */
    fitTransition?: SpringOptions
    /**
     * Spring settings for the zoom factor.
     * Applied on top of the fit scale - independent of fit interpolation.
     */
    zoomTransition?: SpringOptions
    /**
     * Spring settings for the final screen-space translation.
     *
     * Both `panX`/`panY` and `world.x`/`world.y` contribute to screen-space
     * displacement - `world` is perspective-projected before being composited.
     * The spring animates the combined screen-space value.
     */
    panTransition?: SpringOptions
    /**
     * Camera focal length in pixels.
     *
     * When provided and greater than 0, enables perspective.
     */
    focalLength?: number
    /**
     * Color of the overlay mask above the frame.
     */
    maskColor?: string
    /**
     * Opacity of the overlay mask above the frame.
     */
    maskOpacity?: number
    /**
     * Enables pointer interactions for the content rendered inside the device frame.
     *
     * @defaultValue false
     *
     * When `false`, the content host element uses `pointer-events: none` so pointer events can
     * "pass through" to outer Web layout containers (useful for orchestration UIs).
     *
     * When `true`, the content host element uses `pointer-events: auto` so embedded runtimes
     * (e.g. Lynx content) can receive pointer events.
     */
    contentInteractive?: boolean
  }
