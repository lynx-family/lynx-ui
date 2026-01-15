// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

// TODO(@wangyang.ryan) This MainThreadify currently can not work as ITouchEvent is not equal to MainThread:ITouchEvent
// import { MainThreadify } from '../types/MainThreadify';
// interface BaseEventInterface {
//   onLayoutChange?: (e: ReactLynx.CommonEvent) => void;
//   /**
//    * @description MTS version of onTouchMove.
//    * @iOS
//    * @Android
//    */
//   onTouchMove?: (e: ReactLynx.TouchEvent) => void;
//   /**
//    * @description MTS version of onTouchStart.
//    * @iOS
//    * @Android
//    */
//   onTouchStart?: (e: ReactLynx.TouchEvent) => void;
//   /**
//    * @description MTS version of onTouchEnd.
//    * @iOS
//    * @Android
//    */
//   onTouchEnd?: (e: ReactLynx.TouchEvent) => void;
// }

// export type EventMTSInterface = MainThreadify<
// BaseEventInterface,
// | 'onLayoutChange'
// | 'onTouchMove'
// | 'onTouchStart'
// | 'onTouchEnd'
// >;
