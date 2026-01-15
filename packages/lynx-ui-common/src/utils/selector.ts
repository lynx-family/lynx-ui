// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { RefObject } from '@lynx-js/react'

import type { AnyObject, MainThread, NodesRef } from '@lynx-js/types'

export class InvokeRejectError extends Error {
  errorCode: number
  detail?: object | string
  constructor(errorCode: number, errorMsg?: string) {
    super(typeof errorMsg === 'string' ? errorMsg : 'unknown error')
    this.errorCode = errorCode
    this.detail = errorMsg
  }
}

export const setNativePropsByRef = (
  ref: RefObject<NodesRef> | undefined,
  // biome-ignore lint/suspicious/noExplicitAny: expected
  props: Record<string, any>,
) => {
  ref?.current?.setNativeProps(props).exec()
}

export const setNativePropsById = (
  id: string,
  // biome-ignore lint/suspicious/noExplicitAny: expected
  props: Record<string, any>,
) => {
  lynx.createSelectorQuery().select(`#${id}`).setNativeProps(props).exec()
}

export const setNativeProps = (
  target: {
    ref?: RefObject<NodesRef>
    id?: string
  },
  // biome-ignore lint/suspicious/noExplicitAny: expected
  props: Record<string, any>,
) =>
  target.id
    ? setNativePropsById(target.id, props)
    : setNativePropsByRef(target.ref, props)

export const invokeByRef = (
  ref: RefObject<NodesRef> | undefined,
  method: string,
  params?: AnyObject,
): Promise<unknown> =>
  new Promise((resolve, reject) => {
    if (!ref?.current) {
      reject(new InvokeRejectError(2, 'no node found for the ref'))
      return
    }
    ref?.current
      ?.invoke({
        method,
        params,
        success: (res) => {
          resolve(res)
        },
        // biome-ignore lint/suspicious/noExplicitAny:expected
        fail: (res: { code: number, data?: any }) => {
          reject(new InvokeRejectError(res.code, JSON.stringify(res.data)))
        },
      })
      .exec()
  })

export const invokeById = (
  id: string,
  method: string,
  params?: AnyObject,
): Promise<unknown> =>
  new Promise((resolve, reject) => {
    lynx
      .createSelectorQuery()
      .select(`#${id}`)
      .invoke({
        method,
        params,
        success: (res) => {
          resolve(res)
        },
        // biome-ignore lint/suspicious/noExplicitAny:expected
        fail: (res: { code: number, data?: any }) => {
          reject(new InvokeRejectError(res.code, JSON.stringify(res.data)))
        },
      })
      .exec()
  })

export const invoke = (
  target: {
    ref?: RefObject<NodesRef>
    id?: string
  },
  method: string,
  params?: AnyObject,
): Promise<unknown> =>
  target.id
    ? invokeById(target.id, method, params)
    : invokeByRef(target.ref, method, params)

export interface GetRectPromise {
  left: number
  top: number
  width: number
  height: number
  bottom: number
  right: number
}

export const getRectByRef = (
  ref?: RefObject<NodesRef>,
  relativeToScreen = false,
  relativeTo = '',
): Promise<GetRectPromise> =>
  new Promise((resolve, reject) => {
    invokeByRef(ref, 'boundingClientRect', {
      relativeTo: relativeToScreen ? 'screen' : relativeTo,
      androidEnableTransformProps: true,
    })
      .then((res) => {
        resolve(
          res as {
            left: number
            top: number
            width: number
            height: number
            bottom: number
            right: number
          },
        )
      })
      .catch((error: InvokeRejectError) => {
        reject(error)
      })
  })

export const getRootRect = (
  relativeToScreen = false,
  relativeTo = '',
): Promise<GetRectPromise> =>
  new Promise((resolve, reject) => {
    lynx
      .createSelectorQuery()
      .selectRoot()
      .invoke({
        method: 'boundingClientRect',
        params: {
          relativeTo: relativeToScreen ? 'screen' : relativeTo,
          androidEnableTransformProps: true,
        },
        success: (res) => {
          resolve(
            res as {
              left: number
              top: number
              width: number
              height: number
              bottom: number
              right: number
            },
          )
        },
        fail: (res: { code: number, data?: object }) => {
          reject(new InvokeRejectError(res.code, JSON.stringify(res.data)))
        },
      })
      .exec()
  })

export const getRectById = (
  id: string,
  relativeToScreen = false,
  relativeTo = '',
): Promise<GetRectPromise> =>
  new Promise((resolve, reject) => {
    invokeById(id, 'boundingClientRect', {
      relativeTo: relativeToScreen ? 'screen' : relativeTo,
      androidEnableTransformProps: true,
    })
      .then((res) => {
        resolve(
          res as {
            left: number
            top: number
            width: number
            height: number
            bottom: number
            right: number
          },
        )
      })
      .catch((error: InvokeRejectError) => {
        reject(error)
      })
  })

export const getRect = (
  target: {
    ref?: RefObject<NodesRef>
    id?: string
  },
  relativeToScreen = false,
): Promise<GetRectPromise> =>
  target.id
    ? getRectById(target.id, relativeToScreen)
    : getRectByRef(target.ref, relativeToScreen)

export const selectorMT: (selector: string) => MainThread.Element | null = (
  selector: string,
) => {
  'main thread'
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore

  return lynx.querySelector(`#${selector}`)
}
