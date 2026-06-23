<!--
  Copyright 2026 The Lynx Authors. All rights reserved.
  Licensed under the Apache License Version 2.0 that can be found in the
  LICENSE file in the root directory of this source tree.

  Vue Lynx port of the ReactLynx Button example's shared <Heart> icon.
-->
<script setup lang="ts">
import { computed } from 'vue-lynx'

import './Heart.css'

const props = withDefaults(
  defineProps<{ size?: 'md', className?: string }>(),
  { size: 'md', className: 'heart' },
)

const HeartPathData = {
  md:
    'M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5',
}

const clipPath = computed(() => `path("${HeartPathData[props.size]}")`)
</script>

<template>
  <view :class="props.className" :style="{ clipPath }" />
</template>
