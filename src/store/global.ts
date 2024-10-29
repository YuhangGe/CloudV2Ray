import { createStore } from 'lrhs';
import { DefaultSettings, type Settings } from '@/service/settings';
import type { CVMInstance } from '@/service/tencent';
import { load } from '@tauri-apps/plugin-store';
// when using `"withGlobalTauri": true`, you may use
// const { createStore } = window.__TAURI__.store;

// create a new store or load the existing one
const tauriStore = await load('store.bin', {
  // we can save automatically after each store modification
  // autoSave: true,
});

export interface GlobalStore {
  settings: Settings;
  instance?: CVMInstance;
  v2rayState: 'NOT_INSTALLED' | 'INSTALLING' | 'INSTALLED';
}

async function getLs<P extends keyof GlobalStore, T = string>(key: P) {
  const v = await tauriStore.get(`cloudv2ray.${key}`);
  if (typeof v !== 'string' || !v) return undefined;
  return JSON.parse(v) as T;
}
export const globalStore = createStore<GlobalStore>({
  settings: DefaultSettings,
  v2rayState: 'NOT_INSTALLED',
});

export async function loadGlobalSettings() {
  globalStore.set('settings', {
    ...DefaultSettings,
    ...(await getLs('settings')),
  });
}

['settings'].forEach((prop) => {
  globalStore.hook(prop as keyof GlobalStore, (v) => {
    void tauriStore.set(`cloudv2ray.${prop}`, JSON.stringify(v)).then(() => {
      return tauriStore.save();
    });
  });
});
