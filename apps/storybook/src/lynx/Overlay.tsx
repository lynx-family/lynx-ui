import { root, useInitData } from '@lynx-js/react';
import { OverlayView } from '@lynx-js/lynx-ui-overlay';

interface Args {
  visible?: boolean;
  overlayLevel?: number;
}

function App() {
  const args = useInitData() as Args;
  const { visible = true, overlayLevel = 1 } = args;

  return (
    <view style={{ width: '100%', height: '300px', position: 'relative' }}>
      <text style={{ fontSize: '16px', color: '#333' }}>Background Content</text>
      {visible && (
        <OverlayView overlayLevel={overlayLevel}>
          <view style={{ width: '200px', height: '150px', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: '8px', justifyContent: 'center', alignItems: 'center' }}>
            <text style={{ fontSize: '14px', color: '#fff' }}>Overlay Content (Level {overlayLevel})</text>
          </view>
        </OverlayView>
      )}
    </view>
  );
}

root.render(<App />);
