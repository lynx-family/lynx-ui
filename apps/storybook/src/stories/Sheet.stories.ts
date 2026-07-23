import type { Meta, StoryObj } from 'storybook-lynx-rsbuild';
import { createLynxView } from 'storybook-lynx-rsbuild';

type Args = {
  show: boolean;
  side: 'top' | 'bottom' | 'left' | 'right';
  enableDragToClose: boolean;
};

const meta = {
  title: 'Overlay/Sheet',
  render: (args, context) =>
    createLynxView({
      args,
      bundleUrl: './lynx/sheet.web.bundle',
      canvasElement: context.canvasElement,
      height: '400px',
    }),
  argTypes: {
    show: {
      control: { type: 'boolean' },
      description: 'Whether the sheet is visible',
    },
    side: {
      control: { type: 'select' },
      options: ['top', 'bottom', 'left', 'right'],
      description: 'Which edge the sheet slides in from',
    },
    enableDragToClose: {
      control: { type: 'boolean' },
      description: 'Whether the user can drag to dismiss the sheet',
    },
  },
  args: {
    show: true,
    side: 'bottom',
    enableDragToClose: true,
  },
} satisfies Meta<Args>;

export default meta;

export const Bottom: StoryObj<Args> = {
  args: {
    side: 'bottom',
  },
};

export const Top: StoryObj<Args> = {
  args: {
    side: 'top',
  },
};

export const Left: StoryObj<Args> = {
  args: {
    side: 'left',
  },
};

export const NoDrag: StoryObj<Args> = {
  args: {
    side: 'bottom',
    enableDragToClose: false,
  },
};
