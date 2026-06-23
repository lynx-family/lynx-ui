<!--
  Copyright 2026 The Lynx Authors. All rights reserved.
  Licensed under the Apache License Version 2.0 that can be found in the
  LICENSE file in the root directory of this source tree.

  Vue Lynx port of apps/examples/Button/Basic/index.tsx.
  Demonstrates the two ways to consume <Button>:
    1. scoped slot (React render-prop) reading `active` to toggle `.active`
    2. plain children relying on the injected `ui-active` state class
-->
<script setup lang="ts">
import { Button } from '../../components/button/index.js'
import Heart from './shared/Heart.vue'

import '../../styles/luna/index.css'
import './Basic.css'

function onClick() {
  console.info('clicked')
}
</script>

<template>
  <view class="demo-container lunaris-dark luna-gradient-rose">
    <view class="demo-canvas">
      <!-- Usage 1: scoped slot to read `active` state and toggle `.active` for styling -->
      <Button class-name="button-root" @click="onClick">
        <template #default="{ active }">
          <view :class="['button', { active }]">
            <text class="button-text">Button</text>
          </view>
        </template>
      </Button>
      <!-- Usage 2: regular children; styles rely on the injected `ui-active` state class -->
      <Button class-name="button">
        <Heart />
        <text class="button-text">Button</text>
      </Button>
    </view>
  </view>
</template>
