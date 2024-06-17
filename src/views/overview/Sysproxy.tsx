import { invoke } from '@tauri-apps/api/core';
import { App, Switch } from 'antd';
import type { FC } from 'react';
import { useEffect, useState } from 'react';

export const Sysproxy: FC = () => {
  const { message } = App.useApp();
  const [toggling, setToggling] = useState(false);
  const [sysproxy, setSysprox] = useState(false);
  const toggleSysproxy = async (enabled: boolean) => {
    setSysprox(enabled);
    try {
      setToggling(true);
      await invoke('tauri_set_sysproxy', {
        port: 7890,
        enabled,
      });
    } catch (ex) {
      void message.error(`${ex}`);
      setSysprox(!enabled); // rollback
    } finally {
      setToggling(false);
    }
  };
  useEffect(() => {
    invoke<boolean>('tauri_is_sysproxy_enabled', { port: 7890 }).then(
      (v) => {
        setSysprox(v);
      },
      (err) => {
        void message.error(`${err}`);
      },
    );
  }, []);
  return (
    <div className='flex items-center gap-2'>
      <span>系统代理：</span>
      <Switch
        loading={toggling}
        value={sysproxy}
        onChange={(v) => {
          void toggleSysproxy(v);
        }}
      ></Switch>
      {sysproxy ? '已开启' : '未开启'}
    </div>
  );
};
