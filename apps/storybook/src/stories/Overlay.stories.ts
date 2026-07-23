import type { Meta, StoryObj } from 'storybook-lynx-rsbuild';
import { createLynxView } from 'storybook-lynx-rsbuild';

type Args = {
  visible: boolean;
  overlayLevel: 1 | 2 | 3 | 4;
};

const meta = {
  title: 'Overlay/Overlay',
  render: (args, context) =>
    createLynxView({
      args,
      bundleUrl: './lynx/overlay.web.bundle',
      canvasElement: context.canvasElement,
      height: '400px',
    }),
  argTypes: {
    visible: {
      control: { type: 'boolean' },
      description: 'Whether the overlay is visible',
    },
    overlayLevel: {
      control: { type: 'select' },
      options: [1, 2, 3, 4],
      description: 'Z-index stacking level for the overlay',
    },
  },
  args: {
    visible: true,
    overlayLevel: 1,
  },
} satisfies Meta<Args>;

export default meta;

export const Default: StoryObj<Args> = {};

export const Level4: StoryObj<Args> = {
  args: {
    visible: true,
    overlayLevel: 4,
  },
};
