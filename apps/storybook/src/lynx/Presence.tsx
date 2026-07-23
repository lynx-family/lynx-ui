import { root, useInitData } from '@lynx-js/react';
import { Presence } from '@lynx-js/lynx-ui-presence';

interface Args {
  show?: boolean;
  enterDuration?: number;
  exitDuration?: number;
}

function App() {
  const args = useInitData() as Args;
  const { show = true, enterDuration = 300, exitDuration = 200 } = args;

  return (
    <view style={{ width: '100%', padding: '20px', alignItems: 'center' }}>
      <text style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
        show: {String(show)} | enter: {enterDuration}ms | exit: {exitDuration}ms
      </text>
      <Presence show={show} enterDuration={enterDuration} exitDuration={exitDuration}>
        <view style={{ width: '120px', height: '120px', backgroundColor: '#7c3aed', borderRadius: '12px', justifyContent: 'center', alignItems: 'center' }}>
          <text style={{ fontSize: '14px', color: '#fff' }}>Animated</text>
        </view>
      </Presence>
    </view>
  );
}

root.render(<App />);
