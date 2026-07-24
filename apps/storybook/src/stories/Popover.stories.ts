import type { Meta, StoryObj } from 'storybook-lynx-rsbuild';
import { createLynxView } from 'storybook-lynx-rsbuild';

type Args = {
  show: boolean;
  placement: 'top' | 'bottom' | 'left' | 'right' | 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end';
  placementOffset: number;
};

const meta = {
  title: 'Overlay/Popover',
  render: (args, context) =>
    createLynxView({
      args,
      bundleUrl: './lynx/popover.web.bundle',
      canvasElement: context.canvasElement,
      height: '300px',
    }),
  argTypes: {
    show: {
      control: { type: 'boolean' },
      description: 'Whether the popover is visible',
    },
    placement: {
      control: { type: 'select' },
      options: ['top', 'bottom', 'left', 'right', 'top-start', 'top-end', 'bottom-start', 'bottom-end'],
      description: 'Position of the popover relative to the trigger element',
    },
    placementOffset: {
      control: { type: 'number', min: 0, max: 50 },
      description: 'Offset distance from the trigger element in pixels',
    },
  },
  args: {
    show: true,
    placement: 'top',
    placementOffset: 8,
  },
} satisfies Meta<Args>;

export default meta;

export const Top: StoryObj<Args> = {
  args: {
    placement: 'top',
  },
};

export const Bottom: StoryObj<Args> = {
  args: {
    placement: 'bottom',
  },
};

export const Left: StoryObj<Args> = {
  args: {
    placement: 'left',
  },
};

export const Right: StoryObj<Args> = {
  args: {
    placement: 'right',
  },
};
