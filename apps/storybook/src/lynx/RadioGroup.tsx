import { root, useInitData } from '@lynx-js/react';
import { RadioGroupRoot, Radio, RadioIndicator } from '@lynx-js/lynx-ui-radio-group';


interface RadioGroupArgs {
  value: string;
  disabled: boolean;
  options: string[];
}

function App() {
  const args = useInitData() as RadioGroupArgs;
  const { value = '', disabled = false, options = ['Option A', 'Option B', 'Option C'] } = args || {};

  return (
    <RadioGroupRoot
      value={value}
      disabled={disabled}
      onValueChange={(newValue: string) => {
        NativeModules.bridge.call('STORYBOOK_ACTION', { name: 'onChange', args: [newValue] }, () => undefined);
      }}
    >
      {options.map((option) => (
        <view key={option} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Radio value={option}>
            <RadioIndicator
              style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                borderWidth: 2,
                borderColor: value === option ? '#3b82f6' : '#9ca3af',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: disabled ? 0.5 : 1,
              }}
            >
              {value === option && (
                <view
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: '#3b82f6',
                  }}
                />
              )}
            </RadioIndicator>
          </Radio>
          <text style={{ fontSize: 14, color: disabled ? '#9ca3af' : '#1f2937' }}>{option}</text>
        </view>
      ))}
    </RadioGroupRoot>
  );
}

root.render(<App />);
