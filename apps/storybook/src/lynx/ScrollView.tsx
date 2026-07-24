import { root, useInitData } from '@lynx-js/react';
import { ScrollView } from '@lynx-js/lynx-ui-scroll-view';

interface Args {
  scrollOrientation?: 'vertical' | 'horizontal';
  enableScroll?: boolean;
  bounces?: boolean;
}

function App() {
  const args = useInitData() as Args;
  const { scrollOrientation = 'vertical', enableScroll = true, bounces = true } = args;

  const isVertical = scrollOrientation === 'vertical';
  const items = Array.from({ length: 20 }, (_, i) => i);
  const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];

  return (
    <ScrollView
      scrollOrientation={scrollOrientation}
      enableScroll={enableScroll}
      bounces={bounces}
      style={{ width: '100%', height: '400px' }}
    >
      {items.map((i) => (
        <view
          key={i}
          style={{
            width: isVertical ? '100%' : '120px',
            height: isVertical ? '60px' : '100%',
            backgroundColor: colors[i % colors.length],
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: isVertical ? '4px' : '0px',
            marginRight: isVertical ? '0px' : '4px',
          }}
        >
          <text style={{ fontSize: '14px', color: '#fff' }}>Item {i + 1}</text>
        </view>
      ))}
    </ScrollView>
  );
}

root.render(<App />);
