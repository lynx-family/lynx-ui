---
"@lynx-js/lynx-ui-button": patch
"@lynx-js/lynx-ui-common": patch
"@lynx-js/lynx-ui-list": patch
"@lynx-js/lynx-ui-scroll-view": patch
"@lynx-js/lynx-ui-switch": patch
"@lynx-js/lynx-ui-swiper": patch
"@lynx-js/lynx-ui-sortable": patch
"@lynx-js/lynx-ui-draggable": patch
---

Improve Web and desktop touch compatibility by routing `onTouchStart`,
`onTouchMove`, `onTouchEnd`, and `onTouchCancel` through shared touch
emulation in `Button`, `Switch`, `List`, and `ScrollView`.
