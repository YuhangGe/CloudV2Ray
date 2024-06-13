import type { FC } from 'react';
import { Tag } from 'antd';
import { Price } from '../overview/Price';
import { Bandwidth } from '../overview/Bandwind';
import { Instance } from './Instance';
import { Control } from './Control';
import { globalStore } from '@/store/global';

import { RegionOptions } from '@/service/region';

const regionNameMap = Object.fromEntries(RegionOptions.map((r) => [r.value, r.label]));

const InstanceView: FC = () => {
  const [settings] = globalStore.useStore('settings');

  return (
    <div className='mt-2 flex flex-wrap gap-y-5'>
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
        <Bandwidth />
        <Price />
      </div>

      <div className='flex w-60 flex-col gap-4'>
        <div className='text-lg'>主机信息</div>
        <Instance />
        <Control />
      </div>
    </div>
  );
};

export default InstanceView;
