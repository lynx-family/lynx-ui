---
"@lynx-js/lynx-ui-swiper": minor
---

Allow SwiperItem to receive item metadata from Swiper context. In normal usage, users can now write `<SwiperItem>` directly without passing `index`, `realIndex`, or `key={realIndex}`.

```diff
 {({ index, realIndex }) => (
-  <SwiperItem index={index} realIndex={realIndex} key={realIndex}>
+  <SwiperItem>
     {content}
   </SwiperItem>
 )}
```
