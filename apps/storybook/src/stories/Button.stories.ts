import type { Meta, StoryObj } from 'storybook-lynx-rsbuild';
import { createLynxView } from 'storybook-lynx-rsbuild';

type Args = {
  label: string;
  disabled: boolean;
  variant: 'primary' | 'secondary' | 'outline';
};

const meta = {
  title: 'Basic/Button',
  render: (args, context) =>
    createLynxView({
      args,
      bundleUrl: './lynx/button.web.bundle',
      canvasElement: context.canvasElement,
      height: '120px',
    }),
  argTypes: {
    label: {
      control: { type: 'text' },
      description: 'Button text content',
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Whether the button is disabled',
    },
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'outline'],
      description: 'Visual style variant of the button',
    },
  },
  args: {
    label: 'Click Me',
    disabled: false,
    variant: 'primary',
  },
} satisfies Meta<Args>;

export default meta;

export const Primary: StoryObj<Args> = {
  args: {
    label: 'Primary Button',
    variant: 'primary',
  },
};

export const Secondary: StoryObj<Args> = {
  args: {
    label: 'Secondary Button',
    variant: 'secondary',
  },
};

export const Outline: StoryObj<Args> = {
  args: {
    label: 'Outline Button',
    variant: 'outline',
  },
};

export const Disabled: StoryObj<Args> = {
  args: {
    label: 'Disabled Button',
    disabled: true,
    variant: 'primary',
  },
};
