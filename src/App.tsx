import { ConfigProvider, App as AntApp, theme as AntTheme } from 'antd';
import { useEffect, useState } from 'react';
import type { Locale as AntLocale } from 'antd/es/locale';
import { invoke } from '@tauri-apps/api/core';
import { themeStore } from './store/theme';
import { loadAntdLocale, localeStore } from './store/locale';
import { MessageWrapper } from './service/message';
import { Layout } from './Layout';
import { useLogListen } from './views/logview/listen';
import { DescribeInstances } from './service/tencent';
import { globalStore } from './store/global';
import { renderTpl } from './service/util';
import { appendLog } from './store/log';
import configTpl from '@/assets/v2ray.conf.template.json?raw';

function App() {
  const [locale] = localeStore.useStore('currentLanguage');
  const [antdLocale, setAntdLocale] = useState<AntLocale>();
  const [theme] = themeStore.useStore('actualTheme');

  useEffect(() => {
    void loadAntdLocale(locale).then((res) => setAntdLocale(res));
  }, [locale]);

  useLogListen();
  const initialize = async () => {
    const settings = globalStore.get('settings');
    if (!settings.secretKey || !settings.instanceType) return;

    const [err, res] = await DescribeInstances({
      Filters: [
        {
          Name: 'instance-name',
          Values: [settings.resourceName],
        },
      ],
    });
    if (err || !res.InstanceSet.length) return;
    const inst = res.InstanceSet[0];
    globalStore.set('instance', res.InstanceSet[0]);
    const ip = inst.PublicIpAddresses?.[0];
    if (!ip) return;
    const url = `http://${ip}:2081/ping?token=${settings.token}`;
    const x = await invoke('tauri_ping_v2ray_once', {
      url,
    });
    if (x !== 'pong!') {
      return;
    }
    appendLog('[ping] ==> 开始定时 Ping 服务');
    await invoke('tauri_ping_v2ray_interval', { url });
    await invoke('tauri_start_v2ray_server', {
      config: renderTpl(configTpl, {
        REMOTE_IP: ip,
        TOKEN: settings.token,
      }),
    });
  };
  useEffect(() => {
    void initialize();
  }, []);

  return antdLocale ? (
    <ConfigProvider
      locale={antdLocale}
      theme={{
        algorithm: theme === 'dark' ? AntTheme.darkAlgorithm : AntTheme.defaultAlgorithm,
      }}
    >
      <AntApp className='flex size-full overflow-hidden bg-background'>
        <MessageWrapper />
        <Layout />
      </AntApp>
    </ConfigProvider>
  ) : null;
}

export default App;
