import { root, useInitData } from '@lynx-js/react';
import { SliderRoot, SliderTrack, SliderIndicator, SliderThumb } from '@lynx-js/lynx-ui-slider';


interface SliderArgs {
  value: number;
  disabled: boolean;
  step: number;
  enableRTL: boolean;
}

function App() {
  const args = useInitData() as SliderArgs;
  const { value = 0.5, disabled = false, step = 0.01, enableRTL = false } = args || {};

  return (
    <SliderRoot
      value={value}
      disabled={disabled}
      step={step}
      enableRTL={enableRTL}
      onValueChange={(newValue: number) => {
        NativeModules.bridge.call('STORYBOOK_ACTION', { name: 'onValueChange', args: [newValue] }, () => undefined);
      }}
      style={{ width: 200, opacity: disabled ? 0.5 : 1 }}
    >
      <SliderTrack
        style={{
          height: 4,
          borderRadius: 2,
          backgroundColor: '#e5e7eb',
        }}
      >
        <SliderIndicator
          style={{
            height: 4,
            borderRadius: 2,
            backgroundColor: '#3b82f6',
          }}
        />
      </SliderTrack>
      <SliderThumb
        style={{
          width: 20,
          height: 20,
          borderRadius: 10,
          backgroundColor: '#ffffff',
          borderWidth: 2,
          borderColor: '#3b82f6',
        }}
      />
    </SliderRoot>
  );
}

root.render(<App />);
