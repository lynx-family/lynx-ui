import type { Meta, StoryObj } from 'storybook-lynx-rsbuild';
import { createLynxView } from 'storybook-lynx-rsbuild';

type Args = {
  placeholder: string;
  value: string;
  maxLines: number;
  readonly: boolean;
};

const meta = {
  title: 'Form/TextArea',
  render: (args, context) =>
    createLynxView({
      args,
      bundleUrl: './lynx/textarea.web.bundle',
      canvasElement: context.canvasElement,
      height: '200px',
    }),
  argTypes: {
    placeholder: {
      control: { type: 'text' },
      description: 'Placeholder text when textarea is empty',
    },
    value: {
      control: { type: 'text' },
      description: 'Current textarea value',
    },
    maxLines: {
      control: { type: 'number', min: 1, max: 20 },
      description: 'Maximum number of visible lines',
    },
    readonly: {
      control: { type: 'boolean' },
      description: 'Whether the textarea is read-only',
    },
  },
  args: {
    placeholder: 'Enter your message...',
    value: '',
    maxLines: 5,
    readonly: false,
  },
} satisfies Meta<Args>;

export default meta;

export const Default: StoryObj<Args> = {};

export const LongText: StoryObj<Args> = {
  args: {
    value: 'This is a long text content used to demonstrate the TextArea component with multiple lines. It shows how the component handles larger amounts of text input gracefully.',
    maxLines: 8,
  },
};

export const Readonly: StoryObj<Args> = {
  args: {
    value: 'This content cannot be edited.',
    readonly: true,
  },
};
