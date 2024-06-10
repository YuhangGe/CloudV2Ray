import { useEffect, useState, type FC } from 'react';
import { App, Switch, Tag } from 'antd';
import { invoke } from '@tauri-apps/api/core';
import { Balance } from './Balance';
import { Bandwidth } from './Bandwind';
import { Price } from './Price';
import { globalStore } from '@/store/global';

export const OverviewView: FC = () => {
  const [inst] = globalStore.useStore('instance');
  const [sysproxy, setSysprox] = useState(false);
  const { message } = App.useApp();
  const [toggling, setToggling] = useState(false);
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
    <div className='relative flex-1 overflow-x-hidden px-6 pt-5'>
      <div className='mb-7 mr-4 mt-1 flex items-center justify-between'>
        <span className='text-2xl font-medium'>概览</span>
      </div>
      {/* <div>
        <Button
          onClick={() => {
            invoke('tauri_test').then(
              (res) => {
                console.log(res);
              },
              (err) => console.error(err),
            );
          }}
        >
          TEST
        </Button>
      </div> */}
      <div className='flex flex-col gap-4'>
        <div className='flex items-center gap-2'>
          <span>远程地址：</span>
          <Tag>{inst ? `vmess://${inst.PublicIpAddresses?.[0] ?? '-'}:2080` : '-'}</Tag>
        </div>
        <div className='flex items-center gap-2'>
          <span>本地代理：</span>
          <Tag>{inst ? `socks5://127.0.0.1:7890` : '-'}</Tag>
        </div>
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
        <Bandwidth />
        <Balance />
        <Price />
      </div>
    </div>
  );
};
