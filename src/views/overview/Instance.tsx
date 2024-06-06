import { Button, Tag } from 'antd';
import { useEffect, useState, type FC } from 'react';
import { DescribeInstances } from '@/service/tencent';
import { globalStore } from '@/store/global';

export const Instance: FC = () => {
  const [inst, setInst] = globalStore.useStore('instance');
  const [loading, setLoading] = useState(true);

  const loadInst = async (id?: string) => {
    setLoading(true);

    const [err, res] = await DescribeInstances({
      Limit: 1,
      Offset: 0,
      ...(id
        ? { InstanceIds: [id] }
        : {
            Filters: [
              {
                Name: 'instance-name',
                Values: [globalStore.get('settings').resourceName],
              },
            ],
          }),
    });
    setLoading(false);
    if (err || res.TotalCount <= 0) {
      setInst(undefined);
    } else {
      setInst(res.InstanceSet[0]);
    }
  };
  useEffect(() => {
    void loadInst();
  }, []);

  useEffect(() => {
    let tm = 0;
    if (
      !inst ||
      inst.InstanceState === 'PENDING' ||
      inst.InstanceState === 'TERMINATING' ||
      !inst.PublicIpAddresses?.length
    ) {
      tm = window.setTimeout(() => loadInst(inst?.InstanceId), 3000);
    }
    return () => clearTimeout(tm);
  }, [inst]);

  return (
    <>
      <div className='flex items-center gap-2'>
        当前主机：
        <div className='min-w-[131px]'>
          {!inst && !loading && <span className='text-secondary-text'>未创建</span>}
          {inst && <span className='font-medium'>{inst.InstanceName}</span>}
        </div>
        <Button
          loading={loading}
          onClick={() => {
            void loadInst();
          }}
          className='ml-6'
          icon={<span className='icon-[ant-design--reload-outlined]'></span>}
          size='small'
          type='link'
        ></Button>
      </div>
      {inst && (
        <>
          <div className='flex items-center gap-2'>
            主机状态：
            <Tag>{inst.InstanceState}</Tag>
          </div>
          <div className='flex items-center gap-2'>
            公网地址：
            <Tag>{inst.PublicIpAddresses?.[0] || '-'}</Tag>
          </div>
        </>
      )}
    </>
  );
};
