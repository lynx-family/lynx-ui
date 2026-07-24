import { root, useInitData } from '@lynx-js/react';
import { Swiper, SwiperItem } from '@lynx-js/lynx-ui-swiper';

interface Args {
  loop?: boolean;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  duration?: number;
  itemWidth?: number;
}

function App() {
  const args = useInitData() as Args;
  const {
    loop = true,
    autoPlay = false,
    autoPlayInterval = 3000,
    duration = 300,
    itemWidth = 300,
  } = args;

  const slides = [
    { color: '#ef4444', label: 'Slide 1' },
    { color: '#3b82f6', label: 'Slide 2' },
    { color: '#22c55e', label: 'Slide 3' },
    { color: '#f59e0b', label: 'Slide 4' },
    { color: '#8b5cf6', label: 'Slide 5' },
  ];

  return (
    <Swiper
      loop={loop}
      autoPlay={autoPlay}
      autoPlayInterval={autoPlayInterval}
      duration={duration}
      itemWidth={itemWidth}
      style={{ width: '100%', height: '200px' }}
    >
      {slides.map((slide, i) => (
        <SwiperItem key={i}>
          <view style={{ width: '100%', height: '100%', backgroundColor: slide.color, borderRadius: '12px', justifyContent: 'center', alignItems: 'center' }}>
            <text style={{ fontSize: '18px', color: '#fff', fontWeight: 'bold' }}>{slide.label}</text>
          </view>
        </SwiperItem>
      ))}
    </Swiper>
  );
}

root.render(<App />);
