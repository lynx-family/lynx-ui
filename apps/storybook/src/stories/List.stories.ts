import type { Meta, StoryObj } from 'storybook-lynx-rsbuild';
import { createLynxView } from 'storybook-lynx-rsbuild';

type Args = {
  listType: 'single' | 'flow' | 'waterfall';
  spanCount: number;
  scrollOrientation: 'vertical' | 'horizontal';
  mainAxisGap: number;
  crossAxisGap: number;
};

const meta = {
  title: 'Scrollable/List',
  render: (args, context) =>
    createLynxView({
      args,
      bundleUrl: './lynx/list.web.bundle',
      canvasElement: context.canvasElement,
      height: '500px',
    }),
  argTypes: {
    listType: {
      control: { type: 'select' },
      options: ['single', 'flow', 'waterfall'],
      description: 'Layout type for list items',
    },
    spanCount: {
      control: { type: 'number', min: 1, max: 6 },
      description: 'Number of columns (or rows in horizontal mode)',
    },
    scrollOrientation: {
      control: { type: 'select' },
      options: ['vertical', 'horizontal'],
      description: 'Scroll direction of the list',
    },
    mainAxisGap: {
      control: { type: 'number', min: 0, max: 40 },
      description: 'Gap between items along the main axis (px)',
    },
    crossAxisGap: {
      control: { type: 'number', min: 0, max: 40 },
      description: 'Gap between items along the cross axis (px)',
    },
  },
  args: {
    listType: 'single',
    spanCount: 1,
    scrollOrientation: 'vertical',
    mainAxisGap: 8,
    crossAxisGap: 8,
  },
} satisfies Meta<Args>;

export default meta;

export const SingleColumn: StoryObj<Args> = {
  args: {
    listType: 'single',
    spanCount: 1,
  },
};

export const Waterfall: StoryObj<Args> = {
  args: {
    listType: 'waterfall',
    spanCount: 2,
    mainAxisGap: 12,
    crossAxisGap: 12,
  },
};

export const HorizontalFlow: StoryObj<Args> = {
  args: {
    listType: 'flow',
    spanCount: 2,
    scrollOrientation: 'horizontal',
    mainAxisGap: 8,
    crossAxisGap: 8,
  },
};
