import type { Meta, StoryObj } from 'storybook-lynx-rsbuild';
import { createLynxView } from 'storybook-lynx-rsbuild';

type Args = {
  loop: boolean;
  autoPlay: boolean;
  autoPlayInterval: number;
  duration: number;
  itemWidth: number;
};

const meta = {
  title: 'Scrollable/Swiper',
  render: (args, context) =>
    createLynxView({
      args,
      bundleUrl: './lynx/swiper.web.bundle',
      canvasElement: context.canvasElement,
      height: '300px',
    }),
  argTypes: {
    loop: {
      control: { type: 'boolean' },
      description: 'Whether the swiper loops infinitely',
    },
    autoPlay: {
      control: { type: 'boolean' },
      description: 'Whether slides advance automatically',
    },
    autoPlayInterval: {
      control: { type: 'number', min: 500, max: 10000 },
      description: 'Time between auto-play transitions (ms)',
    },
    duration: {
      control: { type: 'number', min: 100, max: 2000 },
      description: 'Transition animation duration (ms)',
    },
    itemWidth: {
      control: { type: 'number', min: 100, max: 600 },
      description: 'Width of each swiper item (px)',
    },
  },
  args: {
    loop: false,
    autoPlay: false,
    autoPlayInterval: 3000,
    duration: 500,
    itemWidth: 300,
  },
} satisfies Meta<Args>;

export default meta;

export const Default: StoryObj<Args> = {};

export const AutoPlay: StoryObj<Args> = {
  args: {
    autoPlay: true,
    autoPlayInterval: 3000,
  },
};

export const Loop: StoryObj<Args> = {
  args: {
    loop: true,
  },
};

export const FastTransition: StoryObj<Args> = {
  args: {
    duration: 150,
    autoPlay: true,
    autoPlayInterval: 1500,
  },
};
