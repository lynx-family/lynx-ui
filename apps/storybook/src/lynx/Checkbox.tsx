import { root, useInitData } from '@lynx-js/react';
import { Checkbox, CheckboxIndicator } from '@lynx-js/lynx-ui-checkbox';


interface CheckboxArgs {
  checked: boolean;
  disabled: boolean;
  indeterminate: boolean;
  label: string;
}

function App() {
  const args = useInitData() as CheckboxArgs;
  const { checked = false, disabled = false, indeterminate = false, label = 'Checkbox' } = args || {};

  return (
    <view style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Checkbox
        checked={checked}
        indeterminate={indeterminate}
        disabled={disabled}
        onChange={(newChecked: boolean) => {
          NativeModules.bridge.call('STORYBOOK_ACTION', { name: 'onChange', args: [newChecked] }, () => undefined);
        }}
      >
        <CheckboxIndicator
          style={{
            width: 20,
            height: 20,
            borderRadius: 4,
            borderWidth: 2,
            borderColor: checked ? '#3b82f6' : '#9ca3af',
            backgroundColor: checked ? '#3b82f6' : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: disabled ? 0.5 : 1,
          }}
        >
          <text style={{ color: '#ffffff', fontSize: 12 }}>✓</text>
        </CheckboxIndicator>
      </Checkbox>
      <text style={{ fontSize: 14, color: disabled ? '#9ca3af' : '#1f2937' }}>{label}</text>
    </view>
  );
}

root.render(<App />);
