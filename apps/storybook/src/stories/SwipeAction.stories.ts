import type { Meta, StoryObj } from 'storybook-lynx-rsbuild';
import { createLynxView } from 'storybook-lynx-rsbuild';

type Args = {
  enableSwipe: boolean;
};

const meta = {
  title: 'Gesture/SwipeAction',
  render: (args, context) =>
    createLynxView({
      args,
      bundleUrl: './lynx/swipe-action.web.bundle',
      canvasElement: context.canvasElement,
      height: '200px',
    }),
  argTypes: {
    enableSwipe: {
      control: { type: 'boolean' },
      description: 'Whether swipe gesture to reveal actions is enabled',
    },
  },
  args: {
    enableSwipe: true,
  },
} satisfies Meta<Args>;

export default meta;

export const Default: StoryObj<Args> = {};

export const Disabled: StoryObj<Args> = {
  args: {
    enableSwipe: false,
  },
};
