import type { Meta, StoryObj } from 'storybook-lynx-rsbuild';
import { createLynxView } from 'storybook-lynx-rsbuild';

type Args = {
  show: boolean;
  clickToClose: boolean;
  overlayLevel: 1 | 2 | 3 | 4;
};

const meta = {
  title: 'Overlay/Dialog',
  render: (args, context) =>
    createLynxView({
      args,
      bundleUrl: './lynx/dialog.web.bundle',
      canvasElement: context.canvasElement,
      height: '400px',
    }),
  argTypes: {
    show: {
      control: { type: 'boolean' },
      description: 'Whether the dialog is visible',
    },
    clickToClose: {
      control: { type: 'boolean' },
      description: 'Whether clicking the backdrop closes the dialog',
    },
    overlayLevel: {
      control: { type: 'select' },
      options: [1, 2, 3, 4],
      description: 'Z-index overlay level for stacking dialogs',
    },
  },
  args: {
    show: true,
    clickToClose: true,
    overlayLevel: 1,
  },
} satisfies Meta<Args>;

export default meta;

export const Default: StoryObj<Args> = {};

export const NoBackdropClose: StoryObj<Args> = {
  args: {
    show: true,
    clickToClose: false,
  },
};

export const Level4: StoryObj<Args> = {
  args: {
    show: true,
    overlayLevel: 4,
  },
};
