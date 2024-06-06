import { Button, Popconfirm } from 'antd';
import { useState, type FC } from 'react';
import { Install } from './Install';
import { loadInstanceDependentResources } from '@/service/instance';
import { CreateInstance, TerminateInstance } from '@/service/tencent';
import { globalStore } from '@/store/global';

export const Control: FC = () => {
  const [inst, setInst] = globalStore.useStore('instance');
  const [creating, setCreating] = useState(false);
  const doCreate = async () => {
    setCreating(true);
    const deps = await loadInstanceDependentResources();
    if (!deps) {
      setCreating(false);
      return;
    }
    const [err, res] = await CreateInstance(deps);
    setCreating(false);
    if (err) return;
    setInst(res);
  };

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
          loading={creating}
          onClick={() => {
            void doCreate();
          }}
          type='primary'
          size='small'
          className='text-xs'
        >
          创建主机
        </Button>
      )}
      {inst && inst.InstanceState === 'RUNNING' && <Install instance={inst} />}
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
