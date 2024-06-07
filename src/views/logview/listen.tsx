import type { UnlistenFn } from '@tauri-apps/api/event';
import { listen } from '@tauri-apps/api/event';
import { useEffect } from 'react';
import { appendLog } from '@/store/log';

export function useLogListen() {
  useEffect(() => {
    const unlisenArray: UnlistenFn[] = [];
    void Promise.all([
      listen('ping::ok', () => appendLog('[ping] ==> 服务器正常响应')),
      listen('ping::fail', () =>
        appendLog('[ping] ==> 服务器响应异常，可能是竞价实例被回收，请刷新主机信息后重新购买'),
      ),
      listen('log::v2ray', (ev) => appendLog(`[v2ray] ==> ${ev.payload}`)),
    ]).then((fns) => unlisenArray.push(...fns));
    return () => {
      unlisenArray.forEach((fn) => fn());
    };
  }, []);
}
