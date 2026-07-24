import type { Meta, StoryObj } from 'storybook-lynx-rsbuild';
import { createLynxView } from 'storybook-lynx-rsbuild';

type Args = {
  enableSorting: boolean;
};

const meta = {
  title: 'Gesture/Sortable',
  render: (args, context) =>
    createLynxView({
      args,
      bundleUrl: './lynx/sortable.web.bundle',
      canvasElement: context.canvasElement,
      height: '400px',
    }),
  argTypes: {
    enableSorting: {
      control: { type: 'boolean' },
      description: 'Whether drag-to-sort interactions are enabled',
    },
  },
  args: {
    enableSorting: true,
  },
} satisfies Meta<Args>;

export default meta;

export const Default: StoryObj<Args> = {};

export const Disabled: StoryObj<Args> = {
  args: {
    enableSorting: false,
  },
};
