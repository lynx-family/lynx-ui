import type { Meta, StoryObj } from 'storybook-lynx-rsbuild';
import { createLynxView } from 'storybook-lynx-rsbuild';

type Args = {
  value: number;
  disabled: boolean;
  step: number;
  enableRTL: boolean;
};

const meta = {
  title: 'Basic/Slider',
  render: (args, context) =>
    createLynxView({
      args,
      bundleUrl: './lynx/slider.web.bundle',
      canvasElement: context.canvasElement,
      height: '120px',
    }),
  argTypes: {
    value: {
      control: { type: 'range', min: 0, max: 1, step: 0.01 },
      description: 'Current slider value between 0 and 1',
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Whether the slider is disabled',
    },
    step: {
      control: { type: 'range', min: 0, max: 1, step: 0.01 },
      description: 'Step increment for the slider',
    },
    enableRTL: {
      control: { type: 'boolean' },
      description: 'Enable right-to-left layout',
    },
  },
  args: {
    value: 0.5,
    disabled: false,
    step: 0.01,
    enableRTL: false,
  },
} satisfies Meta<Args>;

export default meta;

export const Default: StoryObj<Args> = {};

export const Stepped: StoryObj<Args> = {
  args: {
    value: 0.25,
    step: 0.25,
  },
};

export const RTL: StoryObj<Args> = {
  args: {
    value: 0.7,
    enableRTL: true,
  },
};

export const Disabled: StoryObj<Args> = {
  args: {
    value: 0.3,
    disabled: true,
  },
};
