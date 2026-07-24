import type { Meta, StoryObj } from 'storybook-lynx-rsbuild';
import { createLynxView } from 'storybook-lynx-rsbuild';

type Args = {
  show: boolean;
};

const meta = {
  title: 'Animation/Presence',
  render: (args, context) =>
    createLynxView({
      args,
      bundleUrl: './lynx/presence.web.bundle',
      canvasElement: context.canvasElement,
      height: '200px',
    }),
  argTypes: {
    show: {
      control: { type: 'boolean' },
      description: 'Whether the child element is present (triggers enter/exit animations)',
    },
  },
  args: {
    show: true,
  },
} satisfies Meta<Args>;

export default meta;

export const Visible: StoryObj<Args> = {
  args: {
    show: true,
  },
};

export const Hidden: StoryObj<Args> = {
  args: {
    show: false,
  },
};
