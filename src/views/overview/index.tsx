import { useEffect, useRef, type FC } from 'react';
import { Button, Tag } from 'antd';
import type { Child } from '@tauri-apps/plugin-shell';
import { Command } from '@tauri-apps/plugin-shell';
import { Price } from './Price';
import { Instance } from './Instance';
import { Control } from './Control';
import { globalStore } from '@/store/global';

import { RegionOptions } from '@/service/region';
import { invoke } from '@tauri-apps/api/core';

const regionNameMap = Object.fromEntries(RegionOptions.map((r) => [r.value, r.label]));

export const OverviewView: FC = () => {
  const [settings] = globalStore.useStore('settings');
  const v2rayProcess = useRef<Child>();
  const killV2rayProcess = () => {
    if (v2rayProcess.current) {
      v2rayProcess.current.kill();
      v2rayProcess.current = undefined;
    }
  };
  const test = async () => {
    await invoke('tauri_test');
    return;
  };
  useEffect(() => {
    return () => {
      killV2rayProcess();
    };
  }, []);
  return (
    <div className='relative flex-1 overflow-x-hidden px-6 pt-5'>
      <div className='mb-7 mr-4 mt-1 text-2xl font-medium'>概览</div>

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
        <div>
          <Button onClick={() => test()}>TEST</Button>
        </div>
      </div>
    </div>
  );
};
