import { Button } from 'antd';
import { useState, type FC } from 'react';
import {
  installV2RayAgent,
  pingV2RayInterval,
  startV2RayCore,
  waitInstanceAutomationAgentReady,
} from './helper';
import { globalStore } from '@/store/global';
import { loadingMessage } from '@/service/util';

export const Install: FC = () => {
  const [agentInstalled, setAgentInstalled] = globalStore.useStore('agentInstalled');

  const [installing, setInstalling] = useState(false);
  const doInstall = async () => {
    const inst = globalStore.get('instance');
    if (!inst) return;
    setInstalling(true);
    const msg = loadingMessage('正在等待远程主机自动化助手上线...');
    await waitInstanceAutomationAgentReady(inst);
    msg.update('正在远程主机上安装 V2Ray...');
    const x = await installV2RayAgent(inst);
    setInstalling(false);
    if (!x) {
      void msg.end('远程主机 V2Ray 安装失败！', 'error');
    } else {
      void msg.end('远程主机 V2Ray 安装完成！');
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
