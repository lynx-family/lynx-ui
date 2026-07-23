import { root, useInitData } from '@lynx-js/react';
import { List } from '@lynx-js/lynx-ui-list';

interface Args {
  listType?: 'single' | 'flow' | 'waterfall';
  spanCount?: number;
  scrollOrientation?: 'vertical' | 'horizontal';
  mainAxisGap?: number;
  crossAxisGap?: number;
}

function App() {
  const args = useInitData() as Args;
  const {
    listType = 'flow',
    spanCount = 3,
    scrollOrientation = 'vertical',
    mainAxisGap = 8,
    crossAxisGap = 8,
  } = args;

  const items = Array.from({ length: 30 }, (_, i) => i);
  const colors = ['#dc2626', '#ea580c', '#ca8a04', '#16a34a', '#2563eb', '#7c3aed', '#db2777', '#0891b2', '#4f46e5', '#059669'];

  return (
    <List
      listType={listType}
      spanCount={spanCount}
      scrollOrientation={scrollOrientation}
      mainAxisGap={mainAxisGap}
      crossAxisGap={crossAxisGap}
      style={{ width: '100%', height: '500px' }}
    >
      {items.map((i) => (
        <list-item key={i} item-key={String(i)}>
          <view style={{ width: '100%', height: '80px', backgroundColor: colors[i % colors.length], borderRadius: '8px', justifyContent: 'center', alignItems: 'center' }}>
            <text style={{ fontSize: '13px', color: '#fff' }}>Item {i + 1}</text>
          </view>
        </list-item>
      ))}
    </List>
  );
}

root.render(<App />);
