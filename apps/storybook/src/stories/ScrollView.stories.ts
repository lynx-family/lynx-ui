import type { Meta, StoryObj } from 'storybook-lynx-rsbuild';
import { createLynxView } from 'storybook-lynx-rsbuild';

type Args = {
  scrollOrientation: 'vertical' | 'horizontal';
  enableScroll: boolean;
  bounces: boolean;
};

const meta = {
  title: 'Scrollable/ScrollView',
  render: (args, context) =>
    createLynxView({
      args,
      bundleUrl: './lynx/scroll-view.web.bundle',
      canvasElement: context.canvasElement,
      height: '400px',
    }),
  argTypes: {
    scrollOrientation: {
      control: { type: 'select' },
      options: ['vertical', 'horizontal'],
      description: 'Direction in which the content can scroll',
    },
    enableScroll: {
      control: { type: 'boolean' },
      description: 'Whether scrolling is enabled',
    },
    bounces: {
      control: { type: 'boolean' },
      description: 'Whether the scroll view bounces at edges (iOS-style)',
    },
  },
  args: {
    scrollOrientation: 'vertical',
    enableScroll: true,
    bounces: true,
  },
} satisfies Meta<Args>;

export default meta;

export const Vertical: StoryObj<Args> = {
  args: {
    scrollOrientation: 'vertical',
  },
};

export const Horizontal: StoryObj<Args> = {
  args: {
    scrollOrientation: 'horizontal',
  },
};

export const NoBounce: StoryObj<Args> = {
  args: {
    scrollOrientation: 'vertical',
    bounces: false,
  },
};

export const Disabled: StoryObj<Args> = {
  args: {
    enableScroll: false,
  },
};
