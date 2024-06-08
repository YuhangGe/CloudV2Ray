import { Button, Tag } from 'antd';
import { useState, type FC } from 'react';
import { loadInstance } from './helper';
import { globalStore } from '@/store/global';

export const Instance: FC = () => {
  const [inst, setInst] = globalStore.useStore('instance');
  const [loading, setLoading] = useState(false);

  const loadInst = async (id?: string) => {
    setLoading(true);
    const [err, res] = await loadInstance(id);
    setLoading(false);
    if (err || res.TotalCount <= 0) {
      setInst(undefined);
    } else {
      setInst(res.InstanceSet[0]);
    }
  };

  return (
    <>
      <div className='flex items-center gap-2'>
        <span className='whitespace-nowrap'>当前主机：</span>
        <div className='min-w-[131px]'>
          {!inst && !loading && <span className='text-secondary-text'>未创建</span>}
          {inst && <span className='font-medium'>{inst.InstanceName}</span>}
        </div>
        <Button
          loading={loading}
          onClick={() => {
            void loadInst();
          }}
          className='translate-y-[1.5px]'
          icon={<span className='icon-[ant-design--reload-outlined]'></span>}
          size='small'
          type='link'
        ></Button>
      </div>
      {inst && (
        <>
          <div className='flex items-center gap-2'>
            <span className='whitespace-nowrap'>主机状态：</span>
            <Tag>{inst.InstanceState}</Tag>
          </div>
          <div className='flex items-center gap-2'>
            <span className='whitespace-nowrap'>公网地址：</span>
            <Tag>{inst.PublicIpAddresses?.[0] || '-'}</Tag>
          </div>
        </>
      )}
    </>
  );
};
