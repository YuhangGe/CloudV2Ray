import type { UnlistenFn } from '@tauri-apps/api/event';
import { listen } from '@tauri-apps/api/event';
import { useEffect } from 'react';
import { appendLog } from '@/store/log';

export function useLogListen() {
  useEffect(() => {
    const unlisenArray: UnlistenFn[] = [];
    void Promise.all([listen('log::v2ray', (ev) => appendLog(`[v2ray] ==> ${ev.payload}`))]).then(
      (fns) => unlisenArray.push(...fns),
    );
    return () => {
      unlisenArray.forEach((fn) => fn());
    };
  }, []);
}
