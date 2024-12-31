import { type FC, useMemo } from 'react';
import { App, Button, Popover, QRCode, Tag } from 'antd';
import { Balance } from './Balance';
import { Bandwidth } from './Bandwind';
import { Price } from './Price';
// import { Socks } from './Socks';
import { globalStore } from '@/store/global';
import type { CVMInstance } from '@/service/tencent';
import { IS_MOBILE, copyToClipboard } from '@/service/util';

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
      <div className='flex items-center'>
        <span className='mr-2 whitespace-nowrap'>远程地址：</span>
        <Tag className='mr-0 flex-shrink basis-56 overflow-x-auto font-mono'>
          {inst ? `vmess://${inst.PublicIpAddresses?.[0] ?? '-'}:2080` : '-'}
        </Tag>
        {inst && (
          <div className='ml-2 flex w-10 shrink-0 items-center'>
            <ShareCode inst={inst} />
          </div>
        )}
      </div>
      {!IS_MOBILE && (
        <div className='flex'>
          <span className='mr-2 whitespace-nowrap pt-1'>本地代理：</span>
          <div className='flex-shrink basis-56'>
            <Tag
              className='mr-0 w-full overflow-x-auto font-mono'
              style={{
                letterSpacing: '0.08em',
              }}
            >
              {inst ? 'socks5://127.0.0.1:7890' : '-'}
            </Tag>
            {inst && (
              <Tag
                className='mr-0 mt-2 w-full overflow-x-auto font-mono'
                style={{ letterSpacing: '0.15em' }}
              >
                {inst ? 'http://127.0.0.1:7891' : '-'}
              </Tag>
            )}
          </div>
          {
            // 占位，和远程地址保持对齐
            inst && <div className='ml-2 w-10 shrink-0'></div>
          }
        </div>
      )}

      <Bandwidth />
      <Balance />
      <Price />
    </div>
  );
};

export default OverviewView;
