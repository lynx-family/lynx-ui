import { root, useInitData } from '@lynx-js/react';
import { Switch, SwitchTrack, SwitchThumb } from '@lynx-js/lynx-ui-switch';


interface SwitchArgs {
  checked: boolean;
  disabled: boolean;
}

function App() {
  const args = useInitData() as SwitchArgs;
  const { checked = false, disabled = false } = args || {};

  return (
    <Switch
      checked={checked}
      disabled={disabled}
      onChange={() => {
        NativeModules.bridge.call('STORYBOOK_ACTION', { name: 'onChange', args: [!checked] }, () => undefined);
      }}
    >
      <SwitchTrack
        style={{
          width: 44,
          height: 24,
          borderRadius: 12,
          backgroundColor: checked ? '#22c55e' : '#9ca3af',
          opacity: disabled ? 0.5 : 1,
        }}
      />
      <SwitchThumb
        style={{
          width: 20,
          height: 20,
          borderRadius: 10,
          backgroundColor: '#ffffff',
        }}
      />
    </Switch>
  );
}

root.render(<App />);
