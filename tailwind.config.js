import { addDynamicIconSelectors } from '@iconify/tailwind';

import plugin from 'tailwindcss/plugin';
import { getAntdTailwindThemes } from './src/theme-colors';

const { themeColors, lightCss, darkCss } = getAntdTailwindThemes();

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['selector'],
  content: ['./src/**/*.{ts,tsx,html}', './index.html'],
  theme: {
    screens: {
      sm: '580px',
    },
    colors: {
      ...themeColors,
      black: '#000',
      white: '#fff',
      currentcolor: 'currentcolor',
      transparent: 'transparent',
    },
  },
  plugins: [
    addDynamicIconSelectors(),
    plugin(function ({ addComponents }) {
      addComponents({
        ':root': lightCss,
        'body.dark': darkCss,
      });
    }),
  ],
};
