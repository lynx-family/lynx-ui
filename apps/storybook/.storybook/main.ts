import { defineMain } from 'storybook-lynx-rsbuild/node';

export default defineMain({
  stories: ['../src/stories/**/*.stories.ts'],
  staticDirs: [{ from: '../dist/lynx', to: '/lynx' }],
  framework: {
    name: 'storybook-lynx-rsbuild',
    options: {},
  },
});
