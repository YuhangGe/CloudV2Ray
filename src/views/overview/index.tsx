import { useMemo, type FC } from 'react';
import { Button, Popover, Tag, QRCode, App } from 'antd';
import { Balance } from './Balance';
import { Bandwidth } from './Bandwind';
import { Price } from './Price';
import { Sysproxy } from './Sysproxy';
import { globalStore } from '@/store/global';
import type { CVMInstance } from '@/service/tencent';
import { IS_IN_MOBILE, copyToClipboard } from '@/service/util';

const ShareCodeInner: FC<{ url: string }> = ({ url }) => {
  return <QRCode className='h-20 w-20' bordered={false} value={url}></QRCode>;
};
const ShareCode: FC<{ inst: CVMInstance }> = ({ inst }) => {
  const [settings] = globalStore.useStore('settings');
  const { message } = App.useApp();
  const url = useMemo(() => {
    const ip = inst.PublicIpAddresses?.[0];
    if (!ip || !settings.token) return null;
    const config = {
      id: settings.token,
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
    return `vmess://${window.btoa(JSON.stringify(config))}`;
  }, [inst, settings]);
  return !url ? null : (
    <>
      <Popover trigger={['click']} content={<ShareCodeInner url={url} />} destroyTooltipOnHide>
        <Button
          size='small'
          type='link'
          icon={<span className='icon-[ant-design--qrcode-outlined]'></span>}
        />
      </Popover>
      <Button
        size='small'
        type='link'
        onClick={() => {
          void copyToClipboard(url).then(
            () => {
              void message.success('已拷贝！');
            },
            (err) => {
              console.error(err);
            },
          );
        }}
        icon={<span className='icon-[ant-design--copy-outlined]'></span>}
      />
    </>
  );
};
const OverviewView: FC = () => {
  const [inst] = globalStore.useStore('instance');

  return (
    <div className='mt-2 flex flex-col gap-4'>
      <div className='flex items-center gap-2'>
        <span>远程地址：</span>
        <Tag className='flex-1 overflow-x-auto font-mono'>
          {inst ? `vmess://${inst.PublicIpAddresses?.[0] ?? '-'}:2080` : '-'}
        </Tag>
        {inst && <ShareCode inst={inst} />}
      </div>
      {!IS_IN_MOBILE && (
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
      )}
      {!IS_IN_MOBILE && <Sysproxy />}
      <Bandwidth />
      <Balance />
      <Price />
    </div>
  );
};

export default OverviewView;
