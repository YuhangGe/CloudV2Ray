import type { PluginListener } from '@tauri-apps/api/core';
import { addPluginListener, invoke } from '@tauri-apps/api/core';
import { App, Switch } from 'antd';
import type { FC } from 'react';
import { useEffect, useRef, useState } from 'react';
import { IS_IN_MOBILE, renderTpl } from '@/service/util';
import tunConf from '@/assets/sockstun.conf.template.yaml?raw';

export const Sysproxy: FC = () => {
  const { message } = App.useApp();
  const [toggling, setToggling] = useState(false);
  const [sysproxy, setSysprox] = useState(false);
  const lis = useRef<PluginListener>();
  // type Arg = {
  //   vpnFd: number;
  //   filesDir: string;
  //   libsDir: string;
  // };
  // const handleVpn = async (arg: Arg, enabled: boolean) => {
  //   try {
  //     await invoke('plugin:cloudv2ray|tauri_start_tun2socks_server', {
  //       ...arg,
  //       config: renderTpl(tunConf, {}),
  //     });
  //     setSysprox(enabled);
  //   } catch (ex) {
  //     void message.error(`${ex}`);
  //   } finally {
  //     setToggling(false);
  //   }
  // };
  const toggleMobileVpn = async (enabled: boolean) => {
    try {
      setToggling(true);
      // if (lis.current) await lis.current.unregister();
      // lis.current = await addPluginListener('cloudv2ray', 'mobile::vpn', (arg: Arg) => {
      //   // console.log('vpn changed:', ev);
      //   if (lis.current) {
      //     void lis.current.unregister(); // listen only once
      //     lis.current = undefined;
      //   }
      //   void handleVpn(arg, enabled);
      // });
      if (enabled) {
        await invoke('plugin:cloudv2ray|startVpn', {
          config: renderTpl(tunConf, {}),
        });
      } else {
        await invoke('plugin:cloudv2ray|stopVpn');
      }
    } catch (ex) {
      void message.error(`${ex}`);
      setToggling(false);
    }
  };
  const toggleSysproxy = async (enabled: boolean) => {
    try {
      setToggling(true);
      await invoke('tauri_set_sysproxy', {
        port: 7890,
        enabled,
      });
      setSysprox(enabled);
    } catch (ex) {
      void message.error(`${ex}`);
    } finally {
      setToggling(false);
    }
  };
  useEffect(() => {
    !IS_IN_MOBILE &&
      invoke<boolean>('tauri_is_sysproxy_enabled', { port: 7890 }).then(
        (v) => {
          setSysprox(v);
        },
        (err) => {
          void message.error(`${err}`);
        },
      );
    return () => {
      void lis.current?.unregister();
    };
  }, []);
  return (
    <div className='flex items-center gap-2'>
      <span>系统代理：</span>
      <Switch
        loading={toggling}
        value={sysproxy}
        onChange={(v) => {
          if (IS_IN_MOBILE) {
            void toggleMobileVpn(v);
          } else {
            void toggleSysproxy(v);
          }
        }}
      ></Switch>
      {sysproxy ? '已开启' : '未开启'}
    </div>
  );
};
