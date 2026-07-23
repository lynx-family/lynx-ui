import { root, useInitData } from '@lynx-js/react';
import { Input as LynxInput } from '@lynx-js/lynx-ui-input';


interface InputArgs {
  placeholder: string;
  value: string;
  type: 'text' | 'number' | 'digit' | 'password' | 'tel' | 'email';
  maxLength: number;
  readonly: boolean;
  confirmType: 'send' | 'search' | 'go' | 'done' | 'next';
}

function App() {
  const args = useInitData() as InputArgs;
  const {
    placeholder = 'Enter text...',
    value = '',
    type = 'text',
    maxLength = 140,
    readonly = false,
    confirmType = 'done',
  } = args || {};

  return (
    <LynxInput
      placeholder={placeholder}
      value={value}
      type={type}
      maxLength={maxLength}
      readonly={readonly}
      confirmType={confirmType}
      onInput={(inputValue: string, _selectionStart: number, _selectionEnd: number) => {
        NativeModules.bridge.call('STORYBOOK_ACTION', { name: 'onInput', args: [inputValue] }, () => undefined);
      }}
      onConfirm={(confirmValue: string) => {
        NativeModules.bridge.call('STORYBOOK_ACTION', { name: 'onConfirm', args: [confirmValue] }, () => undefined);
      }}
      style={{
        height: 40,
        paddingLeft: 12,
        paddingRight: 12,
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 6,
        fontSize: 14,
      }}
    />
  );
}

root.render(<App />);
