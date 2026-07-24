import type { Meta, StoryObj } from 'storybook-lynx-rsbuild';
import { createLynxView } from 'storybook-lynx-rsbuild';

type Args = {
  checked: boolean;
  disabled: boolean;
  indeterminate: boolean;
  label: string;
};

const meta = {
  title: 'Basic/Checkbox',
  render: (args, context) =>
    createLynxView({
      args,
      bundleUrl: './lynx/checkbox.web.bundle',
      canvasElement: context.canvasElement,
      height: '100px',
    }),
  argTypes: {
    checked: {
      control: { type: 'boolean' },
      description: 'Whether the checkbox is checked',
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Whether the checkbox is disabled',
    },
    indeterminate: {
      control: { type: 'boolean' },
      description: 'Whether the checkbox is in an indeterminate state',
    },
    label: {
      control: { type: 'text' },
      description: 'Label text displayed next to the checkbox',
    },
  },
  args: {
    checked: false,
    disabled: false,
    indeterminate: false,
    label: 'Agree to terms',
  },
} satisfies Meta<Args>;

export default meta;

export const Default: StoryObj<Args> = {};

export const Checked: StoryObj<Args> = {
  args: {
    checked: true,
    label: 'Checked checkbox',
  },
};

export const Indeterminate: StoryObj<Args> = {
  args: {
    indeterminate: true,
    label: 'Indeterminate state',
  },
};

export const Disabled: StoryObj<Args> = {
  args: {
    disabled: true,
    label: 'Disabled checkbox',
  },
};
