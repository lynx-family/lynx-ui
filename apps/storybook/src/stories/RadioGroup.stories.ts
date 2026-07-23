import type { Meta, StoryObj } from 'storybook-lynx-rsbuild';
import { createLynxView } from 'storybook-lynx-rsbuild';

type Args = {
  value: string;
  disabled: boolean;
  options: string[];
};

const meta = {
  title: 'Basic/RadioGroup',
  render: (args, context) =>
    createLynxView({
      args,
      bundleUrl: './lynx/radio-group.web.bundle',
      canvasElement: context.canvasElement,
      height: '200px',
    }),
  argTypes: {
    value: {
      control: { type: 'text' },
      description: 'Currently selected radio option value',
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Whether the entire radio group is disabled',
    },
    options: {
      control: { type: 'object' },
      description: 'Array of option values for the radio group',
    },
  },
  args: {
    value: '',
    disabled: false,
    options: ['A', 'B', 'C'],
  },
} satisfies Meta<Args>;

export default meta;

export const Default: StoryObj<Args> = {};

export const WithSelection: StoryObj<Args> = {
  args: {
    value: 'B',
  },
};

export const Disabled: StoryObj<Args> = {
  args: {
    value: 'A',
    disabled: true,
  },
};
