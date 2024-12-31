import { Button, Popconfirm } from 'antd';
import { type FC, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { TerminateInstance } from '@/service/tencent';
import { globalStore } from '@/store/global';
import { createInstanceAndInstallV2Ray, installV2RayAgentOnInstance } from '@/store/install';

export const Control: FC = () => {
  const [inst, setInst] = globalStore.useStore('instance');
  const [v2rayState] = globalStore.useStore('v2rayState');
  const [settings] = globalStore.useStore('settings');
  const [destroing, setDestroing] = useState(false);
  const doDestroy = async () => {
    if (!inst) return;
    setDestroing(true);
    const [err] = await TerminateInstance(inst.InstanceId);
    setDestroing(false);
    if (!err) {
      setInst(undefined);
      await invoke('tauri_stop_v2ray_server');
    }
  };

  return (
    <div className='flex flex-wrap items-center gap-2 border-t border-t-blue-200 pt-3'>
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
      {settings.imageType !== 'PRIVATE_IMAGE' && inst && inst.InstanceState === 'RUNNING' && (
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
          {v2rayState === 'INSTALLED' ? '重新' : ''}安装 V2Ray
        </Button>
      )}
      {/* {v2rayState === 'INSTALLED' && <DelayDestroy />} */}

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
