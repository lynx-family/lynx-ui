import type { Meta, StoryObj } from 'storybook-lynx-rsbuild';
import { createLynxView } from 'storybook-lynx-rsbuild';

type Args = {
  allowedDirection: 'all' | 'left' | 'right' | 'up' | 'down';
  resetOnEnd: boolean;
  trigger: 'longpress' | 'immediate';
};

const meta = {
  title: 'Gesture/Draggable',
  render: (args, context) =>
    createLynxView({
      args,
      bundleUrl: './lynx/draggable.web.bundle',
      canvasElement: context.canvasElement,
      height: '400px',
    }),
  argTypes: {
    allowedDirection: {
      control: { type: 'select' },
      options: ['all', 'left', 'right', 'up', 'down'],
      description: 'Allowed drag direction constraint',
    },
    resetOnEnd: {
      control: { type: 'boolean' },
      description: 'Whether the element snaps back to origin on drag end',
    },
    trigger: {
      control: { type: 'select' },
      options: ['longpress', 'immediate'],
      description: 'Gesture trigger type to start dragging',
    },
  },
  args: {
    allowedDirection: 'all',
    resetOnEnd: true,
    trigger: 'longpress',
  },
} satisfies Meta<Args>;

export default meta;

export const AllDirections: StoryObj<Args> = {
  args: {
    allowedDirection: 'all',
  },
};

export const HorizontalOnly: StoryObj<Args> = {
  args: {
    allowedDirection: 'left',
  },
};

export const VerticalOnly: StoryObj<Args> = {
  args: {
    allowedDirection: 'up',
  },
};

export const Immediate: StoryObj<Args> = {
  args: {
    trigger: 'immediate',
    resetOnEnd: false,
  },
};
