import { useEffect, useRef, useState, type FC } from 'react';
import { App, Button, Tag } from 'antd';
import { invoke } from '@tauri-apps/api/core';
import type { UnlistenFn } from '@tauri-apps/api/event';
import { listen } from '@tauri-apps/api/event';
import { Price } from './Price';
import { Instance } from './Instance';
import { Control } from './Control';
import { globalStore } from '@/store/global';

import { RegionOptions } from '@/service/region';

const regionNameMap = Object.fromEntries(RegionOptions.map((r) => [r.value, r.label]));

export const OverviewView: FC = () => {
  const [settings] = globalStore.useStore('settings');
  const { message } = App.useApp();
  const el = useRef<HTMLPreElement>(null);

  const test = async () => {
    await invoke('tauri_test');
    return;
  };
  const [tt, setTt] = useState(false);
  const test2 = async () => {
    setTt(true);
    try {
      await invoke('tauri_start_v2ray');
    } catch (ex) {
      void message.error(`${ex}`);
    }
    setTt(false);
  };

  useEffect(() => {
    let unlisten: UnlistenFn;
    void listen('v2ray::log', (ev) => {
      if (!el.current) return;
      // console.log(ev);
      const $p = document.createElement('p');
      $p.innerText = ev.payload as string;
      el.current.appendChild($p);
    }).then((fn) => {
      unlisten = fn;
    });
    return () => {
      unlisten?.();
    };
  }, []);

  return (
    <div className='relative flex-1 overflow-x-hidden px-6 pt-5'>
      <div className='mb-7 mr-4 mt-1 text-2xl font-medium'>概览</div>
      <div>
        <pre ref={el}></pre>
      </div>
      <div className='flex flex-col gap-4'>
        <div className='text-lg'>配置信息</div>
        <div className='flex items-center gap-2'>
          <span>选中规格：</span>
          <Tag>{settings.instanceType}</Tag>
        </div>
        <div className='flex items-center gap-2'>
          <span>主机区域：</span>
          <Tag>{regionNameMap[settings.region]}</Tag>
        </div>
        <Price />

        <div className='text-lg'>主机信息</div>
        <Instance />
        <Control />
        <div className='flex gap-2'>
          <Button onClick={() => test()}>TEST</Button>
          <Button loading={tt} onClick={() => test2()}>
            TEST2
          </Button>
        </div>
      </div>
    </div>
  );
};
