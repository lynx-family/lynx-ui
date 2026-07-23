import { root, useInitData } from '@lynx-js/react';
import { SortableRoot, SortableItem } from '@lynx-js/lynx-ui-sortable';

interface Args {
  enableSorting?: boolean;
}

function App() {
  const args = useInitData() as Args;
  const { enableSorting = true } = args;

  const items = [
    { id: '1', label: 'Apple', color: '#ef4444' },
    { id: '2', label: 'Banana', color: '#eab308' },
    { id: '3', label: 'Cherry', color: '#dc2626' },
    { id: '4', label: 'Grape', color: '#7c3aed' },
    { id: '5', label: 'Kiwi', color: '#22c55e' },
  ];

  return (
    <view style={{ width: '100%', padding: '16px' }}>
      <SortableRoot enableSorting={enableSorting}>
        {items.map((item) => (
          <SortableItem key={item.id} itemKey={item.id}>
            <view style={{ width: '100%', height: '56px', backgroundColor: item.color, borderRadius: '8px', marginBottom: '8px', justifyContent: 'center', paddingLeft: '16px' }}>
              <text style={{ fontSize: '15px', color: '#fff' }}>{item.label}</text>
            </view>
          </SortableItem>
        ))}
      </SortableRoot>
    </view>
  );
}

root.render(<App />);
