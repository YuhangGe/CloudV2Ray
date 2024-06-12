import { Button } from 'antd';
import { type FC } from 'react';
import { globalStore } from '@/store/global';
import { installStore, installV2RayAgentOnInstance } from '@/store/install';

export const Install: FC = () => {
  const [agentInstalled] = installStore.useStore('installed');
  const [installing] = installStore.useStore('installing');

  return (
    <Button
      disabled={agentInstalled}
      loading={installing}
      onClick={() => {
        const inst = globalStore.get('instance');
        if (inst) {
          void installV2RayAgentOnInstance(inst);
        }
      }}
      className='text-xs'
      size='small'
    >
      {agentInstalled ? '已' : ''}安装 V2Ray
    </Button>
  );
};
