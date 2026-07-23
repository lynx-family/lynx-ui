import { root, useInitData } from '@lynx-js/react';


interface ButtonArgs {
  label: string;
  disabled: boolean;
  variant: 'primary' | 'secondary' | 'outline';
}

function App() {
  const args = useInitData() as ButtonArgs;
  const { label = 'Button', disabled = false, variant = 'primary' } = args || {};

  const baseStyle = {
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 16,
    paddingRight: 16,
    borderRadius: 6,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    opacity: disabled ? 0.5 : 1,
  };

  const variantStyles: Record<string, object> = {
    primary: { backgroundColor: '#3b82f6' },
    secondary: { backgroundColor: '#6b7280' },
    outline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#3b82f6' },
  };

  const textColor = variant === 'outline' ? '#3b82f6' : '#ffffff';

  return (
    <view
      style={{ ...baseStyle, ...variantStyles[variant] }}
      bindtap={() => {
        if (!disabled) {
          NativeModules.bridge.call('STORYBOOK_ACTION', { name: 'onClick', args: [] }, () => undefined);
        }
      }}
    >
      <text style={{ color: textColor, fontSize: 14, fontWeight: 'bold' }}>{label}</text>
    </view>
  );
}

root.render(<App />);
