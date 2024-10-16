import { Button, Tag, message } from 'antd';
import { type FC, useEffect, useState } from 'react';
import { loadInstance } from './helper';
import { globalStore } from '@/store/global';
import { copyToClipboard } from '@/service/util';

export const Instance: FC = () => {
  const [inst, setInst] = globalStore.useStore('instance');
  const [v2rayState] = globalStore.useStore('v2rayState');
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

  useEffect(() => {
    if (inst?.InstanceState === 'TERMINATING') {
      setTimeout(() => {
        void loadInst(inst.InstanceId);
      }, 2000);
    }
  }, [inst]);

  const status = () => {
    if (!inst) return '-';
    if (inst.InstanceState === 'PENDING') {
      return '创建中...';
    } else if (inst.InstanceState === 'RUNNING') {
      if (v2rayState === 'INSTALLING') return '安装 V2Ray 中...';
      else if (v2rayState === 'INSTALLED') return 'V2Ray 正常运行';
      else return '待安装 V2Ray';
    } else {
      return inst.InstanceState;
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
            <Tag>{status()}</Tag>
          </div>
          <div className='flex items-center gap-2'>
            <span className='whitespace-nowrap'>公网地址：</span>
            <Tag
              className='cursor-pointer'
              onClick={() => {
                const ip = inst.PublicIpAddresses?.[0];
                if (ip) {
                  void copyToClipboard(`ssh ubuntu@${ip}`).then(() => {
                    void message.success('已复制');
                  });
                }
              }}
            >
              {inst.PublicIpAddresses?.[0] || '-'}
            </Tag>
          </div>
        </>
      )}
    </>
  );
};
