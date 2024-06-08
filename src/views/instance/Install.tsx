import { App, Button } from 'antd';
import { useState, type FC } from 'react';
import { installV2RayAgent, pingV2RayInterval, startV2RayCore } from './helper';
import { globalStore } from '@/store/global';
import { uid } from '@/service/util';

export const Install: FC = () => {
  const [agentInstalled, setAgentInstalled] = globalStore.useStore('agentInstalled');
  const { message } = App.useApp();

  const [installing, setInstalling] = useState(false);
  const doInstall = async () => {
    const inst = globalStore.get('instance');
    if (!inst) return;
    const msgId = uid();
    void message.open({
      key: msgId,
      type: 'loading',
      content: '正在远程主机上安装 V2Ray，请勿其它操作...',
      duration: 0,
    });
    setInstalling(true);
    const x = await installV2RayAgent(inst);
    setInstalling(false);
    if (!x) {
      void message.open({
        key: msgId,
        type: 'error',
        content: '远程主机 V2Ray 安装失败！',
        duration: 5,
      });
    } else {
      void message.open({
        key: msgId,
        type: 'success',
        content: '远程主机 V2Ray 安装完成！',
        duration: 3,
      });
      setAgentInstalled(true);
      void pingV2RayInterval();
      void startV2RayCore();
    }
  };

  return (
    <Button
      disabled={agentInstalled}
      loading={installing}
      onClick={() => {
        void doInstall();
      }}
      className='text-xs'
      size='small'
    >
      {agentInstalled ? '已' : ''}安装 V2Ray
    </Button>
  );
};
