import { Button, Popconfirm } from 'antd';
import { useState, type FC } from 'react';
import { DelayDestroy } from './DelayDestroy';
import { TerminateInstance } from '@/service/tencent';
import { globalStore } from '@/store/global';
import { createInstanceAndInstallV2Ray, installV2RayAgentOnInstance } from '@/store/install';

export const Control: FC = () => {
  const [inst, setInst] = globalStore.useStore('instance');
  const [v2rayState] = globalStore.useStore('v2rayState');

  const [destroing, setDestroing] = useState(false);
  const doDestroy = async () => {
    if (!inst) return;
    setDestroing(true);
    const [err] = await TerminateInstance(inst.InstanceId);
    setDestroing(false);
    if (!err) {
      setInst(undefined);
    }
  };

  return (
    <div className='flex items-center gap-2'>
      {!inst && (
        <Button
          loading={v2rayState === 'INSTALLING'}
          onClick={() => {
            void createInstanceAndInstallV2Ray();
          }}
          type='primary'
          size='small'
          className='text-xs'
        >
          创建主机
        </Button>
      )}
      {inst && inst.InstanceState === 'RUNNING' && v2rayState !== 'INSTALLED' && (
        <Button
          loading={v2rayState === 'INSTALLING'}
          onClick={() => {
            const inst = globalStore.get('instance');
            if (inst) {
              void installV2RayAgentOnInstance(inst);
            }
          }}
          className='text-xs'
          size='small'
        >
          安装 V2Ray
        </Button>
      )}
      {v2rayState === 'INSTALLED' && <DelayDestroy />}

      {!!inst && (
        <Popconfirm
          title='确认销毁主机？'
          description='销毁后 v2ray 服务不可用，请重新创建主机'
          onConfirm={() => {
            void doDestroy();
          }}
        >
          <Button loading={destroing} danger size='small' className='text-xs'>
            销毁主机
          </Button>
        </Popconfirm>
      )}
    </div>
  );
};
