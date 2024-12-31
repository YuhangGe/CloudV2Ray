import { App as AntApp, Button, Dropdown, Spin, Tooltip } from 'antd';
import { type FC, Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { IS_MOBILE, cs, useQuery } from './service/util';
import { globalStore } from './store/global';
import { useLogListen } from './views/logview/listen';
import { appendLog } from './store/log';

import {
  loadInstance,
  pingV2RayInterval,
  pingV2RayOnce,
  startV2RayCore,
} from './views/instance/helper';
import imgLogo from '@/assets/logo-128x128.png';
import { validateSettings } from './service/settings';

const InstanceView = lazy(() => import('./views/instance'));
const SettingsView = lazy(() => import('./views/settings'));
const OverviewView = lazy(() => import('./views/overview'));
const LogView = lazy(() => import('./views/logview'));

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
    validateSettings(settings) != null ? 'settings' : 'overview',
  );
  const title = useMemo(() => {
    return ViewItems.find((it) => it.key === view)?.label;
  }, [view]);

  useLogListen();

  const initialize = async () => {
    try {
      const [err, res] = await loadInstance();

      if (err || !res.InstanceSet.length) return;
      const inst = res.InstanceSet[0];
      globalStore.set('instance', inst);
      if (!(await pingV2RayOnce(inst))) {
        return;
      }
      globalStore.set('v2rayState', 'INSTALLED');
      appendLog('[ping] ==> 开始定时 Ping 服务');
      if (!pingV2RayInterval()) {
        void message.error('pingV2RayInterval 失败，请尝试退出后重启 CloudV2Ray。');
        return;
      }
      if (!IS_MOBILE && !(await startV2RayCore())) {
        void message.error('本地 v2ray-core 启动失败，请尝试退出后重启 CloudV2Ray。');
      }
    } catch (ex) {
      void message.error(`${ex}`);
    } finally {
      if (!globalStore.get('instance') || globalStore.get('v2rayState') !== 'INSTALLED') {
        setView('instance');
      }
      setLoaded(true);
    }
  };
  useEffect(() => {
    const settings = globalStore.get('settings');
    if (validateSettings(settings) != null) {
      setLoaded(true);
      return;
    }
    void initialize();
  }, []);

  // const [x, setX] = useState(false);

  return loaded ? (
    <>
      <div className='flex w-28 flex-shrink-0 flex-col border-r border-solid border-border max-sm:hidden'>
        <div className='pl-5 pt-[5px]'>
          <img src={imgLogo} className='size-16' />
        </div>
        {ViewItems.map((item) => (
          <div
            key={item.key}
            onClick={() => {
              const err = validateSettings(settings);
              if (err != null) {
                void message.error(err);
                return;
              }
              setView(item.key);
            }}
            className={cs(
              'flex w-full cursor-pointer items-center py-5 pl-5 text-lg hover:bg-hover hover:text-white',
              view === item.key && 'text-blue',
            )}
          >
            {item.icon}
            <span className='ml-2'>{item.label}</span>
          </div>
        ))}
        <div className='flex-1'></div>
        <Tooltip title='退出 CloudV2Ray，结束本地代理'>
          <Button
            onClick={async () => {
              await invoke('plugin:cloudv2ray|tauri_stop_v2ray_server');
              await invoke('tauri_exit_process');
            }}
            className='flex items-center justify-center pb-4 pt-2'
            style={{ width: '100%' }}
            icon={<span className='icon-[grommet-icons--power-shutdown]'></span>}
            type='link'
            danger
          />
        </Tooltip>
      </div>
      <div className='flex flex-1 flex-col overflow-x-hidden px-6 pt-6'>
        <div className='mb-4 flex items-center sm:mb-5'>
          <div className='flex items-center text-2xl sm:hidden'>
            <img src={imgLogo} className='block size-10' />
            <span className='ml-2 font-medium'>CloudV2Ray</span>
            <span className='mx-2'>-</span>
          </div>
          <div className='whitespace-nowrap text-2xl max-sm:text-secondary-text'>{title}</div>
          <div className='flex-1' />
          {/* <Button
            loading={x}
            onClick={async () => {
              setX(true);
              const r = await invoke('plugin:cloudv2ray|startVpn');
              console.log(r);
              setX(false);
            }}
          >
            T
          </Button> */}
          <Dropdown
            trigger={['click']}
            menu={{
              items: ViewItems.map((item) => ({
                label: (
                  <div className='flex items-center gap-3 py-2 pl-1 pr-2'>
                    <span className='translate-y-0.5'>{item.icon}</span>
                    {item.label}
                  </div>
                ),
                key: item.key,
              })),
              onClick(info) {
                setView(info.key);
              },
            }}
          >
            <Button
              className='sm:hidden'
              icon={<span className='icon-[ant-design--menu-outlined] shrink-0'></span>}
            />
          </Dropdown>
        </div>
        {view === 'overview' && (
          <Suspense>
            <OverviewView />
          </Suspense>
        )}
        {view === 'instance' && (
          <Suspense>
            <InstanceView />
          </Suspense>
        )}
        {view === 'settings' && (
          <Suspense>
            <SettingsView />
          </Suspense>
        )}
        {view === 'logs' && (
          <Suspense>
            <LogView />
          </Suspense>
        )}
      </div>
    </>
  ) : (
    <div className='flex w-full items-center justify-center'>
      <Spin />
    </div>
  );
};
