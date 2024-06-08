import { App, Button, Popconfirm } from 'antd';
import { useState, type FC } from 'react';
import { createPortal } from 'react-dom';
import { Install } from './Install';
import { installV2RayAgent, pingV2RayInterval, startV2RayCore, waitInstanceReady } from './helper';
import { loadInstanceDependentResources } from '@/service/instance';
import { CreateInstance, TerminateInstance } from '@/service/tencent';
import { globalStore } from '@/store/global';
import { uid } from '@/service/util';

export const Control: FC = () => {
  const [inst, setInst] = globalStore.useStore('instance');
  const [creating, setCreating] = useState(false);
  const { message } = App.useApp();
  const doCreate = async () => {
    const msgId = uid();
    void message.open({
      type: 'loading',
      content: '正在创建主机...',
      duration: 0,
      key: msgId,
    });
    const final = () => {
      setCreating(false);
      message.destroy(msgId);
    };
    setCreating(true);
    const deps = await loadInstanceDependentResources();
    if (!deps) {
      return final();
    }
    const [err, res] = await CreateInstance(deps);
    if (err) return final();
    setInst(res);
    void message.open({
      key: msgId,
      type: 'loading',
      duration: 0,
      content: '正在等待主机启动...',
    });
    await waitInstanceReady(res);
    void message.open({
      key: msgId,
      type: 'loading',
      duration: 0,
      content: '正在远程主机上安装 V2Ray 服务...',
    });
    const x = await installV2RayAgent(res);
    setCreating(false);
    if (!x) {
      void message.open({
        key: msgId,
        type: 'error',
        duration: 5,
        content: '远程主机安装 V2Ray 失败！请尝试重新安装。',
      });
    } else {
      globalStore.set('agentInstalled', true);
      void pingV2RayInterval();
      void startV2RayCore();
    }
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
      {creating &&
        createPortal(
          <div className='fixed z-10 size-full bg-white opacity-10'></div>,
          document.body,
        )}
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
