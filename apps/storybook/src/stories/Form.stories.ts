import type { Meta, StoryObj } from 'storybook-lynx-rsbuild';
import { createLynxView } from 'storybook-lynx-rsbuild';

type Args = {
  showValidation: boolean;
};

const meta = {
  title: 'Form/Form',
  render: (args, context) =>
    createLynxView({
      args,
      bundleUrl: './lynx/form.web.bundle',
      canvasElement: context.canvasElement,
      height: '400px',
    }),
  argTypes: {
    showValidation: {
      control: { type: 'boolean' },
      description: 'Whether to display validation error messages',
    },
  },
  args: {
    showValidation: false,
  },
} satisfies Meta<Args>;

export default meta;

export const Default: StoryObj<Args> = {};

export const WithValidation: StoryObj<Args> = {
  args: {
    showValidation: true,
  },
};
