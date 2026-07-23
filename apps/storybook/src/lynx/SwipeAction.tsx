import { root, useInitData } from '@lynx-js/react';
import { SwipeAction } from '@lynx-js/lynx-ui-swipe-action';

interface Args {
  enableSwipe?: boolean;
}

function App() {
  const args = useInitData() as Args;
  const { enableSwipe = true } = args;

  return (
    <view style={{ width: '100%', padding: '16px' }}>
      <SwipeAction
        enableSwipe={enableSwipe}
        rightActions={
          <view style={{ flexDirection: 'row' }}>
            <view style={{ backgroundColor: '#f59e0b', width: '72px', height: '64px', justifyContent: 'center', alignItems: 'center' }}>
              <text style={{ fontSize: '13px', color: '#fff' }}>Archive</text>
            </view>
            <view style={{ backgroundColor: '#ef4444', width: '72px', height: '64px', justifyContent: 'center', alignItems: 'center' }}>
              <text style={{ fontSize: '13px', color: '#fff' }}>Delete</text>
            </view>
          </view>
        }
      >
        <view style={{ width: '100%', height: '64px', backgroundColor: '#fff', borderRadius: '8px', justifyContent: 'center', paddingLeft: '16px', borderWidth: '1px', borderColor: '#e5e7eb' }}>
          <text style={{ fontSize: '15px', color: '#333' }}>Swipe left to reveal actions</text>
        </view>
      </SwipeAction>
    </view>
  );
}

root.render(<App />);
