// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { useRef, useState } from '@lynx-js/react'
import type { JSX } from '@lynx-js/react'

import {
  Button,
  Checkbox,
  DialogView,
  Input,
  InputOTP,
  InputOTPSlot,
  Switch,
  Swiper,
  SwiperItem,
  ViewPager,
} from '@lynx-js/lynx-ui'
import type {
  ButtonProps,
  DialogViewProps,
  InputRef,
  InputOTPRef,
  SwiperRef,
  ViewPagerProps,
  ViewPagerRef,
} from '@lynx-js/lynx-ui'
import { Button as DirectButton } from '@lynx-js/lynx-ui-button'
import { DialogView as DirectDialogView } from '@lynx-js/lynx-ui-dialog'
import { ViewPager as DirectViewPager } from '@lynx-js/lynx-ui-view-pager'

const buttonProps = { disabled: false, onClick: () => {} } satisfies ButtonProps
const pages = [{ id: 1, title: 'First page' }]
const pagerProps = {
  data: pages,
  getItemKey: item => item.id,
  children: item => <text>{item.title}</text>,
} satisfies ViewPagerProps<(typeof pages)[number]>

export function ComponentConsumers(): JSX.Element {
  const inputRef = useRef<InputRef>(null)
  const otpRef = useRef<InputOTPRef>(null)
  const swiperRef = useRef<SwiperRef>(null)
  const pagerRef = useRef<ViewPagerRef>(null)
  const [level, setLevel] = useState<DialogViewProps['overlayLevel']>(2)

  const handleClick = () => {
    inputRef.current?.focus()
    otpRef.current?.setValue('123456')
    swiperRef.current?.swipeNext()
    pagerRef.current?.scrollToPage(1)
    setLevel(3)
  }

  return (
    <view>
      <Button {...buttonProps} onClick={handleClick}>
        {({ active, disabled }) => (
          <text>{active || disabled ? 'Yes' : 'No'}</text>
        )}
      </Button>
      <DirectButton {...buttonProps}>
        <text>Direct export</text>
      </DirectButton>
      <Checkbox onChange={checked => checked satisfies boolean}>
        {({ checked }) => <text>{checked ? 'Checked' : 'Unchecked'}</text>}
      </Checkbox>
      <Switch onChange={checked => checked satisfies boolean}>
        {({ checked }) => <text>{checked ? 'On' : 'Off'}</text>}
      </Switch>
      <DialogView overlayLevel={level}>
        {({ open }) => <text>{open ? 'Open' : 'Closed'}</text>}
      </DialogView>
      <DirectDialogView overlayLevel={level}>
        <text>Dialog</text>
      </DirectDialogView>
      <Input
        ref={inputRef}
        onInput={value => {
          value satisfies string
          // @ts-expect-error the inferred input value must not be any.
          value satisfies number
        }}
      />
      <InputOTP ref={otpRef} onChange={value => value satisfies string}>
        {({ complete }) => (
          <InputOTPSlot index={0}>
            {({ char }) => <text>{complete ? char : '-'}</text>}
          </InputOTPSlot>
        )}
      </InputOTP>
      <Swiper
        ref={swiperRef}
        data={pages}
        mode='normal'
        itemWidth={300}
        onChange={index => index satisfies number}
      >
        {({ index }) => (
          <SwiperItem>
            <text>{index}</text>
          </SwiperItem>
        )}
      </Swiper>
      <ViewPager {...pagerProps} ref={pagerRef} />
      <DirectViewPager
        ref={pagerRef}
        data={pages}
        getItemKey={item => item.id}
        onPageChange={event => {
          event.detail.index satisfies number
          // @ts-expect-error the inferred page index must not be any.
          event.detail.index satisfies string
        }}
      >
        {(item, index) => <text>{item.title}: {index}</text>}
      </DirectViewPager>
    </view>
  )
}

// These must stay errors in both environments; permissive compatibility types
// would otherwise let a consumer check pass without validating its contracts.
// @ts-expect-error disabled must be boolean.
export const invalidButton = <Button disabled='yes' />
// @ts-expect-error direct exports must reject the same invalid props.
export const invalidDirectButton = <DirectButton disabled='yes' />
// @ts-expect-error overlay levels are restricted by the public API.
export const invalidDialog = <DialogView overlayLevel={5} children={null} />
export const invalidDirectDialog = (
  // @ts-expect-error direct exports must preserve the overlay-level union.
  <DirectDialogView overlayLevel={5} children={null} />
)
// @ts-expect-error Input refs must expose InputRef methods.
export const invalidInputRef = <Input ref={{ current: { unrelated: true } }} />
export const invalidPager = (
  <ViewPager data={pages}>
    {item => {
      // @ts-expect-error ViewPager must infer each page's object type.
      return <text>{item.missing}</text>
    }}
  </ViewPager>
)
export const invalidDirectPager = (
  <DirectViewPager data={pages}>
    {item => {
      // @ts-expect-error direct ViewPager must also infer each page's object type.
      return <text>{item.missing}</text>
    }}
  </DirectViewPager>
)
