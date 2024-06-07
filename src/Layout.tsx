import { App as AntApp } from 'antd';
import type { FC } from 'react';
import { InstanceView } from './views/instance';
import { cs, useQuery } from './service/util';
import { SettingsView } from './views/settings';
import { globalStore } from './store/global';
import { OverviewView } from './views/overview';
import { LogView } from './views/logview';

const ViewItems = [
  {
    label: '概览',
    icon: <span className='icon-[material-symbols--overview-key-outline]'></span>,
    key: 'overview',
  },
  {
    label: '主机',
    icon: <span className='icon-[ant-design--cloud-server-outlined]'></span>,
    key: 'instance',
  },
  {
    label: '设置',
    icon: <span className='icon-[ant-design--setting-outlined]'></span>,
    key: 'settings',
  },
  {
    label: '日志',
    icon: <span className='icon-[tabler--logs]'></span>,
    key: 'logs',
  },
];

export const Layout: FC = () => {
  const { message } = AntApp.useApp();
  const [settings] = globalStore.useStore('settings');

  const [view, setView] = useQuery(
    'view',
    settings.secretKey && settings.instanceType ? 'overview' : 'settings',
  );

  return (
    <>
      <div className='flex w-32 flex-shrink-0 flex-col border-r border-solid border-border'>
        <div className='pb-3 pl-4 pt-5 text-3xl'>V2RAY</div>
        {ViewItems.map((item) => (
          <div
            key={item.key}
            onClick={() => {
              if (!settings.secretKey) {
                void message.error('请先配置密钥参数');
                return;
              }
              if (!settings.instanceType) {
                void message.error('请先配置主机参数');
                return;
              }
              setView(item.key);
            }}
            className={cs(
              'flex w-full cursor-pointer items-center py-5 pl-4 text-lg hover:bg-hover hover:text-white',
              view === item.key && 'text-blue',
            )}
          >
            {item.icon}
            <span className='ml-2'>{item.label}</span>
          </div>
        ))}
      </div>
      {view === 'overview' && <OverviewView />}
      {view === 'instance' && <InstanceView />}
      {view === 'settings' && <SettingsView />}
      {view === 'logs' && <LogView />}
    </>
  );
};
