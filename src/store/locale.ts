import { createStore } from 'lrhs';

export type Locale = 'zh-cn' | 'zh-tr' | 'en';

const LocaleKey = 'cloudv2ray.language';
function getLocale(): Locale {
  const lang = (localStorage.getItem(LocaleKey) ?? navigator.language ?? 'en')
    .toLowerCase()
    .replace(/_/g, '-');
  if (lang === 'zh-cn') {
    return lang;
  } else if (lang.startsWith('zh')) {
    return 'zh-tr';
  } else {
    return 'en';
  }
}

export function loadAntdLocale(loc: Locale) {
  if (loc === 'zh-cn') return import('antd/locale/zh_CN').then((res) => res.default);
  else if (loc === 'zh-tr') return import('antd/locale/zh_TW').then((res) => res.default);
  else return import('antd/locale/en_US').then((res) => res.default);
}

export interface LocaleStore {
  currentLanguage: Locale;
}
export const localeStore = createStore<LocaleStore>({
  currentLanguage: getLocale(),
});
localeStore.hook('currentLanguage', (v) => {
  localStorage.setItem(LocaleKey, v);
});
