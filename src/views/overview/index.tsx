import { type FC } from 'react';
import { Tag } from 'antd';
import { globalStore } from '@/store/global';

export const OverviewView: FC = () => {
  const [inst] = globalStore.useStore('instance');
  return (
    <div className='relative flex-1 overflow-x-hidden px-6 pt-5'>
      <div className='mb-7 mr-4 mt-1 text-2xl font-medium'>概览</div>

      <div className='flex flex-col gap-4'>
        <div className='flex items-center gap-2'>
          <span>远程地址：</span>
          <Tag>{inst ? `vmess://${inst.PublicIpAddresses?.[0] ?? '-'}:2080` : '-'}</Tag>
        </div>
        <div className='flex items-center gap-2'>
          <span>本地代理：</span>
          <Tag>{inst ? `socks5://127.0.0.1:7890` : '-'}</Tag>
        </div>
      </div>
    </div>
  );
};
