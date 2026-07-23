import type { Meta, StoryObj } from 'storybook-lynx-rsbuild';
import { createLynxView } from 'storybook-lynx-rsbuild';

type Args = {
  checked: boolean;
  disabled: boolean;
};

const meta = {
  title: 'Basic/Switch',
  render: (args, context) =>
    createLynxView({
      args,
      bundleUrl: './lynx/switch.web.bundle',
      canvasElement: context.canvasElement,
      height: '100px',
    }),
  argTypes: {
    checked: {
      control: { type: 'boolean' },
      description: 'Whether the switch is in the on state',
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Whether the switch is disabled',
    },
  },
  args: {
    checked: false,
    disabled: false,
  },
} satisfies Meta<Args>;

export default meta;

export const Default: StoryObj<Args> = {};

export const Checked: StoryObj<Args> = {
  args: {
    checked: true,
  },
};

export const Disabled: StoryObj<Args> = {
  args: {
    disabled: true,
  },
};
