import { useEffect, useState, type FC } from 'react';
import { App, Button, Popover, Switch, Tag, QRCode } from 'antd';
import { invoke } from '@tauri-apps/api/core';
import { Balance } from './Balance';
import { Bandwidth } from './Bandwind';
import { Price } from './Price';
import { globalStore } from '@/store/global';
import type { CVMInstance } from '@/service/tencent';

const ShareCodeInner: FC<{ inst: CVMInstance }> = ({ inst }) => {
  const ip = inst.PublicIpAddresses?.[0];
  const token = globalStore.get('settings').token;
  if (!ip || !token) return null;
  const config = {
    id: token,
    add: ip,
    port: '2080',
    alpn: '',
    fp: '',
    host: '',
    aid: '0',
    net: 'tcp',
    path: '',
    scy: 'none',
    sni: 'tls',
    type: 'none',
    v: '2',
    ps: 'a',
  };
  const x = `vmess://${window.btoa(JSON.stringify(config))}`;
  return <QRCode className='h-20 w-20' bordered={false} value={x}></QRCode>;
};
const ShareCode: FC<{ inst: CVMInstance }> = ({ inst }) => {
  return (
    <Popover trigger={['click']} content={<ShareCodeInner inst={inst} />} destroyTooltipOnHide>
      <Button
        size='small'
        type='link'
        icon={<span className='icon-[ant-design--qrcode-outlined]'></span>}
      />
    </Popover>
  );
};
const OverviewView: FC = () => {
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

      <div className='flex flex-col gap-4'>
        <div className='flex items-center gap-2'>
          <span>远程地址：</span>
          <Tag className='font-mono'>
            {inst ? `vmess://${inst.PublicIpAddresses?.[0] ?? '-'}:2080` : '-'}
          </Tag>
          {inst && <ShareCode inst={inst} />}
        </div>
        <div className='flex gap-2'>
          <span className='relative top-0.5'>本地代理：</span>
          {inst ? (
            <div className='flex flex-col gap-1 font-mono'>
              <Tag className='font-mono'>
                <span className='inline-block w-10'>socks5</span>
                {'://127.0.0.1:7890'}
              </Tag>
              {/* <Tag className='font-mono'>
                <span style={{ letterSpacing: '0.38em' }} className='inline-block w-10'>
                  http
                </span>
                {'://127.0.0.1:7891'}
              </Tag> */}
            </div>
          ) : (
            '-'
          )}
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

export default OverviewView;
