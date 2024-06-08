import { App as AntApp, Spin } from 'antd';
import { useEffect, useState, type FC } from 'react';
import { InstanceView } from './views/instance';
import { cs, useQuery } from './service/util';
import { SettingsView } from './views/settings';
import { globalStore } from './store/global';
import { OverviewView } from './views/overview';
import { LogView } from './views/logview';
import { useLogListen } from './views/logview/listen';
import { appendLog } from './store/log';
import {
  loadInstance,
  pingV2RayInterval,
  pingV2RayOnce,
  startV2RayCore,
} from './views/instance/helper';

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
  const [loaded, setLoaded] = useState(false);

  const [view, setView] = useQuery(
    'view',
    settings.secretKey && settings.instanceType ? 'overview' : 'settings',
  );

  useLogListen();

  const initialize = async () => {
    const settings = globalStore.get('settings');
    if (!settings.secretKey || !settings.instanceType) return;

    const [err, res] = await loadInstance();
    if (err || !res.InstanceSet.length) return;
    const inst = res.InstanceSet[0];
    globalStore.set('instance', inst);
    if (!(await pingV2RayOnce(inst))) {
      return;
    }
    globalStore.set('agentInstalled', true);
    appendLog('[ping] ==> 开始定时 Ping 服务');
    void pingV2RayInterval();
    void startV2RayCore();
  };
  useEffect(() => {
    void initialize()
      .catch((ex) => {
        void message.error(`${ex}`);
      })
      .finally(() => {
        if (!globalStore.get('instance') || !globalStore.get('agentInstalled')) {
          setView('instance');
        }
        setLoaded(true);
      });
  }, []);

  return loaded ? (
    <>
      <div className='flex w-32 flex-shrink-0 flex-col border-r border-solid border-border'>
        <div
          className='cursor-pointer pb-3 pl-4 pt-5 text-3xl'
          onClick={() => {
            history.replaceState(null, '', '/');
            location.reload();
          }}
        >
          V2RAY
        </div>
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
  ) : (
    <div className='flex w-full items-center justify-center'>
      <Spin />
    </div>
  );
};
