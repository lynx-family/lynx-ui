import { root, useInitData } from '@lynx-js/react';
import { SheetRoot, SheetView, SheetBackdrop, SheetContent, SheetHandle } from '@lynx-js/lynx-ui-sheet';


interface SheetArgs {
  show: boolean;
  side: 'bottom' | 'top' | 'left' | 'right';
  snapPoints: Array<number | string>;
  enableDragToClose: boolean;
}

function App() {
  const args = useInitData() as SheetArgs;
  const {
    show = true,
    side = 'bottom',
    snapPoints = ['50%', 'fit'],
    enableDragToClose = true,
  } = args || {};

  return (
    <SheetRoot
      show={show}
      side={side}
      snapPoints={snapPoints}
      enableDragToClose={enableDragToClose}
      onClose={() => {
        NativeModules.bridge.call('STORYBOOK_ACTION', { name: 'onClose', args: [] }, () => undefined);
      }}
    >
      <SheetBackdrop
        clickToClose={true}
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        }}
      />
      <SheetView>
        <SheetContent
          style={{
            backgroundColor: '#ffffff',
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            paddingTop: 16,
            paddingBottom: 24,
            paddingLeft: 16,
            paddingRight: 16,
          }}
        >
          <SheetHandle
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              backgroundColor: '#d1d5db',
              alignSelf: 'center',
              marginBottom: 16,
            }}
          />
          <text style={{ fontSize: 18, fontWeight: 'bold', color: '#1f2937', marginBottom: 8 }}>
            Sheet Title
          </text>
          <text style={{ fontSize: 14, color: '#6b7280' }}>
            This is the sheet content area. Drag the handle to resize or close.
          </text>
        </SheetContent>
      </SheetView>
    </SheetRoot>
  );
}

root.render(<App />);
