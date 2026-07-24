import type { Meta, StoryObj } from 'storybook-lynx-rsbuild';
import { createLynxView } from 'storybook-lynx-rsbuild';

type Args = {
  placeholder: string;
  value: string;
  type: 'text' | 'password' | 'number' | 'email' | 'tel';
  maxLength: number;
  readonly: boolean;
  confirmType: 'send' | 'search' | 'next' | 'go' | 'done';
};

const meta = {
  title: 'Form/Input',
  render: (args, context) =>
    createLynxView({
      args,
      bundleUrl: './lynx/input.web.bundle',
      canvasElement: context.canvasElement,
      height: '120px',
    }),
  argTypes: {
    placeholder: {
      control: { type: 'text' },
      description: 'Placeholder text when input is empty',
    },
    value: {
      control: { type: 'text' },
      description: 'Current input value',
    },
    type: {
      control: { type: 'select' },
      options: ['text', 'password', 'number', 'email', 'tel'],
      description: 'Input type determining keyboard and validation behavior',
    },
    maxLength: {
      control: { type: 'number', min: 0, max: 500 },
      description: 'Maximum character length allowed',
    },
    readonly: {
      control: { type: 'boolean' },
      description: 'Whether the input is read-only',
    },
    confirmType: {
      control: { type: 'select' },
      options: ['send', 'search', 'next', 'go', 'done'],
      description: 'The action button label on soft keyboard',
    },
  },
  args: {
    placeholder: 'Enter text...',
    value: '',
    type: 'text',
    maxLength: 100,
    readonly: false,
    confirmType: 'done',
  },
} satisfies Meta<Args>;

export default meta;

export const Default: StoryObj<Args> = {};

export const Password: StoryObj<Args> = {
  args: {
    placeholder: 'Enter password...',
    type: 'password',
  },
};

export const Number: StoryObj<Args> = {
  args: {
    placeholder: 'Enter number...',
    type: 'number',
  },
};

export const Readonly: StoryObj<Args> = {
  args: {
    value: 'Read-only content',
    readonly: true,
  },
};

export const WithMaxLength: StoryObj<Args> = {
  args: {
    placeholder: 'Max 20 characters',
    maxLength: 20,
  },
};
