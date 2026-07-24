import { pluginReactLynx } from '@lynx-js/react-rsbuild-plugin';
import { defineConfig } from '@lynx-js/rspeedy';

export default defineConfig({
  environments: {
    web: {},
  },
  source: {
    entry: {
      // Basic Components
      'button': './src/lynx/Button.tsx',
      'switch': './src/lynx/Switch.tsx',
      'checkbox': './src/lynx/Checkbox.tsx',
      'radio-group': './src/lynx/RadioGroup.tsx',
      'slider': './src/lynx/Slider.tsx',
      // Input Components
      'input': './src/lynx/Input.tsx',
      'textarea': './src/lynx/TextArea.tsx',
      // Layout & Container Components
      'dialog': './src/lynx/Dialog.tsx',
      'popover': './src/lynx/Popover.tsx',
      'sheet': './src/lynx/Sheet.tsx',
      'overlay': './src/lynx/Overlay.tsx',
      'presence': './src/lynx/Presence.tsx',
      // Scrollable Components
      'scroll-view': './src/lynx/ScrollView.tsx',
      'list': './src/lynx/List.tsx',
      'swiper': './src/lynx/Swiper.tsx',
      // Interactive Components
      'draggable': './src/lynx/Draggable.tsx',
      'sortable': './src/lynx/Sortable.tsx',
      'swipe-action': './src/lynx/SwipeAction.tsx',
      // Form Components
      'form': './src/lynx/Form.tsx',
    },
  },
  output: {
    distPath: { root: 'dist/lynx' },
    filename: '[name].[platform].bundle',
  },
  plugins: [
    pluginReactLynx({
      enableCSSInheritance: true,
      enableCSSSelector: true,
      enableNewGesture: true,
    }),
  ],
});
