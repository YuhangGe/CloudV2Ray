import type { FC } from 'react';
import { Tag } from 'antd';
import { Price } from './Price';
import { Instance } from './Instance';
import { Control } from './Control';
import { globalStore } from '@/store/global';

import { RegionOptions } from '@/service/region';

const regionNameMap = Object.fromEntries(RegionOptions.map((r) => [r.value, r.label]));

export const InstanceView: FC = () => {
  const [settings] = globalStore.useStore('settings');

  return (
    <div className='relative flex-1 overflow-x-hidden px-6 pt-5'>
      <div className='mb-7 mr-4 mt-1 whitespace-nowrap text-2xl font-medium'>
        <span className='whitespace-nowrap'>主机</span>
        <span className='ml-4 whitespace-nowrap text-base text-secondary-text'>腾讯云</span>
      </div>

      <div className='flex flex-wrap gap-y-5'>
        <div className='flex w-72 flex-col gap-4'>
          <div className='text-lg'>配置信息</div>
          <div className='flex items-center gap-2'>
            <span className='whitespace-nowrap'>选中规格：</span>
            <Tag>{settings.instanceType}</Tag>
          </div>
          <div className='flex items-center gap-2'>
            <span className='whitespace-nowrap'>主机区域：</span>
            <Tag>{regionNameMap[settings.region]}</Tag>
          </div>
          <Price />
        </div>

        <div className='flex w-60 flex-col gap-4'>
          <div className='text-lg'>主机信息</div>
          <Instance />
          <Control />
        </div>
      </div>
    </div>
  );
};
