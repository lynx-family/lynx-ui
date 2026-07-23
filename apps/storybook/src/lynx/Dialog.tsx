import { root, useInitData } from '@lynx-js/react';
import { DialogRoot, DialogBackdrop, DialogContent } from '@lynx-js/lynx-ui-dialog';


interface DialogArgs {
  show: boolean;
  clickToClose: boolean;
  overlayLevel: 1 | 2 | 3 | 4;
}

function App() {
  const args = useInitData() as DialogArgs;
  const { show = true, clickToClose = true } = args || {};

  return (
    <DialogRoot
      show={show}
      onShowChange={(open: boolean) => {
        if (!open) {
          NativeModules.bridge.call('STORYBOOK_ACTION', { name: 'onClose', args: [] }, () => undefined);
        }
      }}
      onClose={() => {
        NativeModules.bridge.call('STORYBOOK_ACTION', { name: 'onClose', args: [] }, () => undefined);
      }}
    >
      <DialogBackdrop
        clickToClose={clickToClose}
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        }}
      />
      <DialogContent
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 12,
          paddingTop: 24,
          paddingBottom: 24,
          paddingLeft: 24,
          paddingRight: 24,
          width: 280,
          alignItems: 'center',
        }}
      >
        <text style={{ fontSize: 18, fontWeight: 'bold', color: '#1f2937', marginBottom: 8 }}>
          Dialog Title
        </text>
        <text style={{ fontSize: 14, color: '#6b7280', textAlign: 'center' }}>
          This is sample dialog content. You can place any content here.
        </text>
      </DialogContent>
    </DialogRoot>
  );
}

root.render(<App />);
