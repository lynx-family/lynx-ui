import { root, useInitData } from '@lynx-js/react';
import { Draggable } from '@lynx-js/lynx-ui-draggable';

interface Args {
  allowedDirection?: 'all' | 'horizontal' | 'vertical';
  resetOnEnd?: boolean;
  trigger?: 'longPress' | 'immediate';
}

function App() {
  const args = useInitData() as Args;
  const { allowedDirection = 'all', resetOnEnd = false, trigger = 'immediate' } = args;

  return (
    <view style={{ width: '100%', height: '400px', backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center' }}>
      <text style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '20px' }}>
        direction: {allowedDirection} | reset: {String(resetOnEnd)} | trigger: {trigger}
      </text>
      <Draggable allowedDirection={allowedDirection} resetOnEnd={resetOnEnd} trigger={trigger}>
        <view style={{ width: '100px', height: '100px', backgroundColor: '#6366f1', borderRadius: '16px', justifyContent: 'center', alignItems: 'center' }}>
          <text style={{ fontSize: '13px', color: '#fff' }}>Drag me</text>
        </view>
      </Draggable>
    </view>
  );
}

root.render(<App />);
