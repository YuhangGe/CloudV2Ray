import { createStore } from 'lrhs';
const ThemeKey = 'cloudv2ray.theme';

export type Theme = 'dark' | 'light' | 'system';
export type ActualTheme = Exclude<Theme, 'system'>;

export interface ThemeStore {
  theme: Theme;
  actualTheme: ActualTheme;
}

const mm = window.matchMedia('(prefers-color-scheme: dark)');
export const themeStore = createStore<ThemeStore>(
  (() => {
    let theme = localStorage.getItem(ThemeKey);
    if (theme !== 'dark' && theme !== 'light') {
      theme = 'system';
    }
    const actualTheme = theme === 'system' ? (mm.matches ? 'dark' : 'light') : theme;
    return {
      theme,
      actualTheme,
    } as ThemeStore;
  })(),
);
function applyTheme() {
  const at = themeStore.get('actualTheme');
  document.body.classList[at === 'dark' ? 'add' : 'remove']('dark');
}
applyTheme();

mm.addEventListener('change', (ev) => {
  if (themeStore.get('theme') === 'system') {
    themeStore.set('actualTheme', ev.matches ? 'dark' : 'light');
    applyTheme();
  }
});

themeStore.hook('theme', (v) => {
  localStorage.setItem(ThemeKey, v);
  themeStore.set('actualTheme', v === 'system' ? (mm.matches ? 'dark' : 'light') : v);
  applyTheme();
});
