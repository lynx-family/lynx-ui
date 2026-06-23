<!--
  Copyright 2026 The Lynx Authors. All rights reserved.
  Licensed under the Apache License Version 2.0 that can be found in the
  LICENSE file in the root directory of this source tree.

  Vue Lynx port of the ReactLynx `<Button>` headless component.
  The public API mirrors `packages/lynx-ui-button/src/Button.tsx` 1:1:
    - props:  disabled, className, style, buttonProps
    - emits:  click                (React: onClick)
    - slot:   default scoped slot  (React: render-prop children)
    - context: { active, disabled } provided to descendants
    - injects `ui-active` / `ui-disabled` state classes for CSS styling
-->
<script setup lang="ts">
import { computed } from 'vue-lynx'

import { provideButtonContext } from './context.js'
import { useTouchActive } from './useTouchActive.js'
import type { ButtonEmits, ButtonProps } from './types.js'

const props = withDefaults(defineProps<ButtonProps>(), {
  disabled: false,
})

const emit = defineEmits<ButtonEmits>()

// Reactive disabled flag shared with the touch tracker and the context.
const disabled = computed(() => props.disabled)

const { active, handlers } = useTouchActive(disabled)

// Only when the button is active and not disabled is the active style applied,
// matching `isEffectiveActive = active && !disabled` in React.
const isEffectiveActive = computed(() => active.value && !props.disabled)

// Equivalent to `clsx(className, { 'ui-active', 'ui-disabled' })` in React.
const rootClass = computed(() => [
  props.className,
  {
    'ui-active': isEffectiveActive.value,
    'ui-disabled': props.disabled,
  },
])

// Mirror `<ButtonContext.Provider value={{ active: isEffectiveActive, disabled }}>`.
provideButtonContext({ active: isEffectiveActive, disabled })

function handleTap() {
  if (props.disabled) return
  emit('click')
}
</script>

<template>
  <view
    :class="rootClass"
    :style="props.style"
    :event-through="false"
    v-bind="props.buttonProps"
    @tap="handleTap"
    @touchstart="handlers.touchstart"
    @touchend="handlers.touchend"
    @touchcancel="handlers.touchcancel"
  >
    <!--
      Default scoped slot mirrors React render-prop children. Plain children
      ignore the slot props; render-prop consumers read { active, disabled }.
    -->
    <slot :active="isEffectiveActive" :disabled="props.disabled" />
  </view>
</template>
