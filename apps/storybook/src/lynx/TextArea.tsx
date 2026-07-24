import { root, useInitData } from '@lynx-js/react';
import { TextArea as LynxTextArea } from '@lynx-js/lynx-ui-input';


interface TextAreaArgs {
  placeholder: string;
  value: string;
  maxLines: number;
  readonly: boolean;
}

function App() {
  const args = useInitData() as TextAreaArgs;
  const {
    placeholder = 'Enter text...',
    value = '',
    maxLines = 5,
    readonly = false,
  } = args || {};

  return (
    <LynxTextArea
      placeholder={placeholder}
      value={value}
      maxLines={maxLines}
      readonly={readonly}
      onInput={(inputValue: string, _selectionStart: number, _selectionEnd: number) => {
        NativeModules.bridge.call('STORYBOOK_ACTION', { name: 'onInput', args: [inputValue] }, () => undefined);
      }}
      style={{
        minHeight: 80,
        paddingTop: 8,
        paddingBottom: 8,
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
