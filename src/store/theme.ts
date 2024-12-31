import { createStore } from 'lrhs';
const ThemeKey = 'cloudv2ray.theme';

export type Theme = 'dark' | 'light' | 'system';
export type ActualTheme = Exclude<Theme, 'system'>;

export interface ThemeStore {
  theme: Theme;
  actualTheme: ActualTheme;
  underSm: boolean;
}

const themeMq = window.matchMedia('(prefers-color-scheme: dark)');
const bpMq = window.matchMedia('(min-width: 580px)'); // 此处 580px 需要和 tailwind.config.ts 中的 sm: '580px' 保持一致
export const themeStore = createStore<ThemeStore>(
  (() => {
    let theme = localStorage.getItem(ThemeKey);
    if (theme !== 'dark' && theme !== 'light') {
      theme = 'system';
    }
    const actualTheme = theme === 'system' ? (themeMq.matches ? 'dark' : 'light') : theme;
    return {
      theme,
      actualTheme,
      underSm: !bpMq.matches,
    } as ThemeStore;
  })(),
);
function applyTheme() {
  const at = themeStore.get('actualTheme');
  document.body.classList[at === 'dark' ? 'add' : 'remove']('dark');
}
applyTheme();

themeMq.addEventListener('change', (ev) => {
  if (themeStore.get('theme') === 'system') {
    themeStore.set('actualTheme', ev.matches ? 'dark' : 'light');
    applyTheme();
  }
});
bpMq.addEventListener('change', (ev) => {
  themeStore.set('underSm', !ev.matches);
});
themeStore.hook('theme', (v) => {
  localStorage.setItem(ThemeKey, v);
  themeStore.set('actualTheme', v === 'system' ? (themeMq.matches ? 'dark' : 'light') : v);
  applyTheme();
});
