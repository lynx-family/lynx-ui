import { root, useInitData } from '@lynx-js/react';
import { PopoverRoot, PopoverTrigger, PopoverContent, PopoverArrow, PopoverPositioner } from '@lynx-js/lynx-ui-popover';


interface PopoverArgs {
  show: boolean;
  placement: 'top' | 'bottom' | 'left' | 'right';
  placementOffset: number;
}

function App() {
  const args = useInitData() as PopoverArgs;
  const { show = true, placement = 'bottom', placementOffset = 8 } = args || {};

  return (
    <PopoverRoot
      show={show}
      onVisibleChange={(visible: boolean) => {
        NativeModules.bridge.call('STORYBOOK_ACTION', { name: 'onVisibleChange', args: [visible] }, () => undefined);
      }}
    >
      <PopoverTrigger>
        <view
          style={{
            paddingTop: 8,
            paddingBottom: 8,
            paddingLeft: 16,
            paddingRight: 16,
            backgroundColor: '#3b82f6',
            borderRadius: 6,
          }}
        >
          <text style={{ color: '#ffffff', fontSize: 14 }}>Toggle Popover</text>
        </view>
      </PopoverTrigger>
      <PopoverPositioner placement={placement} placementOffset={placementOffset}>
        <PopoverContent
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 8,
            paddingTop: 12,
            paddingBottom: 12,
            paddingLeft: 16,
            paddingRight: 16,
            borderWidth: 1,
            borderColor: '#e5e7eb',
          }}
        >
          <PopoverArrow size={8} color="#ffffff" />
          <text style={{ fontSize: 14, color: '#1f2937' }}>Popover content goes here</text>
        </PopoverContent>
      </PopoverPositioner>
    </PopoverRoot>
  );
}

root.render(<App />);
