import { Button, Popconfirm } from 'antd';
import { useState, type FC } from 'react';
import { createPortal } from 'react-dom';
import { Install } from './Install';
import { TerminateInstance } from '@/service/tencent';
import { globalStore } from '@/store/global';
import { createInstanceAndInstallV2Ray, installStore } from '@/store/install';

export const Control: FC = () => {
  const [inst, setInst] = globalStore.useStore('instance');
  const [creating] = installStore.useStore('installing');

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
      {creating &&
        createPortal(
          <div className='fixed z-10 size-full bg-white opacity-10'></div>,
          document.body,
        )}
      {!inst && (
        <Button
          loading={creating}
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
      {inst && inst.InstanceState === 'RUNNING' && !creating && <Install />}
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
