// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * Dimensions of the container and the base frame.
 */
export interface FitInput {
  /** Container width in pixels */
  containerWidth: number
  /** Container height in pixels */
  containerHeight: number
  /** Base frame width in pixels */
  baseWidth: number
  /** Base frame height in pixels */
  baseHeight: number
}

/**
 * Contain and cover scale factors for a base frame fitted into a container.
 * The two values bracket the valid scale range.
 *
 * - `contain`: the base frame is fully visible inside the container
 * - `cover`: the container is fully filled, base frame may be cropped
 */
export interface ScaleRange {
  contain: number
  cover: number
}

/**
 * Pre-computed alignment factors along each axis.
 * Each value is in [0, 1]: 0 = start, 0.5 = center, 1 = end.
 */
export interface AlignFactors {
  ax: number
  ay: number
}

/**
 * Input for computing the frame's transform offset.
 */
export type FrameOffsetInput = {
  baseWidth: number
  baseHeight: number
  scale: number
} & AlignFactors

/**
 * 2D translation offset for a frame transform.
 */
export interface FrameOffset {
  offsetX: number
  offsetY: number
}

/**
 * Compute the contain and cover scale factors for a base frame
 * fitted into a container.
 */
export function computeScaleRange(input: FitInput): ScaleRange {
  const { containerWidth, containerHeight, baseWidth, baseHeight } = input
  if (
    !Number.isFinite(baseWidth) || baseWidth <= 0
    || !Number.isFinite(baseHeight) || baseHeight <= 0
  ) {
    throw new RangeError(
      `computeScaleRange: baseWidth and baseHeight must be finite and > 0, got ${baseWidth}x${baseHeight}`,
    )
  }
  const ratioW = containerWidth / baseWidth
  const ratioH = containerHeight / baseHeight
  return {
    contain: Math.min(ratioW, ratioH),
    cover: Math.max(ratioW, ratioH),
  }
}

/**
 * Interpolate between contain and cover scale using a 0–1 progress value.
 *
 * - `t = 0`: behaves like contain
 * - `t = 1`: behaves like cover
 */
export function lerpFitScale(
  { contain, cover }: ScaleRange,
  t: number,
): number {
  return contain + (cover - contain) * t
}

/**
 * Compute the transform offset for a scaled frame,
 * given pre-computed scale and alignment factors.
 *
 * ax / ay are the normalized coordinates of the anchor point within the frame;
 * the returned offset is applied to a top-left-origin transform.
 */
export function computeFrameOffset(input: FrameOffsetInput): FrameOffset {
  const { baseWidth, baseHeight, scale, ax, ay } = input
  return {
    offsetX: -(baseWidth * scale) * ax,
    offsetY: -(baseHeight * scale) * ay,
  }
}

export interface DepthScaleOptions {
  /**
   * Optional upper bound for the returned scale.
   * When omitted, no clamping is applied and the raw value (or `Infinity`
   * at the singularity) is returned. Pass a finite value to guard against
   * extreme scales in rendering contexts that cannot handle `Infinity`.
   */
  maxScale?: number
}

/**
 * Compute the perspective depth scale for a given world-space Z position.
 *
 * Follows the CSS / OpenGL convention: +Z points toward the viewer.
 * Equivalent to the perspective divide in a pinhole camera model:
 * `w = f / (f - z)`, where `f` is the focal length.
 *
 * - `z > 0`: object is closer to the viewer, scale > 1 (appears larger)
 * - `z < 0`: object is further from the viewer, scale < 1 (appears smaller)
 * - `z = 0`: no perspective effect, scale = 1
 * - `z >= f`: object is at or behind the camera optical center —
 *   physically undefined (singularity). Returns `options.maxScale` if
 *   provided, otherwise `Infinity`.
 * - Returns `1` (orthographic) when `focalLength` is absent or `<= 0`.
 */
export function computeDepthScale(
  focalLength: number | undefined,
  worldZ: number,
  options?: DepthScaleOptions,
): number {
  if (!focalLength || focalLength <= 0) return 1
  const denom = focalLength - worldZ
  if (denom <= 0) return options?.maxScale ?? Number.POSITIVE_INFINITY
  const scale = focalLength / denom
  return options?.maxScale === undefined
    ? scale
    : Math.min(scale, options.maxScale)
}

export interface ScreenTranslation {
  /** Final screen-space translation along X, in pixels */
  x: number
  /** Final screen-space translation along Y, in pixels */
  y: number
}

export interface ScreenTranslationInput {
  /** World-space X position of the frame */
  worldX: number
  /** World-space Y position of the frame */
  worldY: number
  /** Perspective depth scale — output of `computeDepthScale` */
  depthScale: number
  /** Direct screen-space pan offset along X, in pixels */
  screenPanX: number
  /** Direct screen-space pan offset along Y, in pixels */
  screenPanY: number
}

/**
 * Compute the final screen-space translation by projecting world-space
 * XY coordinates into screen space via the perspective depth scale,
 * then adding direct screen-space pan offsets.
 *
 * This compensates for the principal-point shift that occurs when an
 * object moves in Z — without this, a depth change would also cause
 * an unwanted lateral drift on screen.
 */
export function computeScreenTranslation(
  input: ScreenTranslationInput,
): ScreenTranslation {
  const { worldX, worldY, depthScale, screenPanX, screenPanY } = input
  return {
    x: worldX * depthScale + screenPanX,
    y: worldY * depthScale + screenPanY,
  }
}
