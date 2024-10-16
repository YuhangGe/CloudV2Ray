import { App, Button, Modal, Tag, Tooltip } from 'antd';
import TextArea from 'antd/es/input/TextArea';
import { type FC, useMemo, useState } from 'react';
import { getInstanceAgentShell } from '@/service/instance';
import { copyToClipboard } from '@/service/util';

export const ExportInner: FC<{ onClose: () => void }> = ({ onClose }) => {
  const shell = useMemo(() => getInstanceAgentShell(), []);
  const { message } = App.useApp();

  return (
    <>
      <p className='pt-2 text-xs leading-[1.5] text-secondary-text'>
        在<Tag className='mx-0.5'>主机</Tag>界面点击<Tag className='mx-0.5'>安装 V2Ray</Tag>
        按钮后，以下脚本会通过腾讯云自动化助手功能在远程主机上执行。执行后会启动 nodejs 版本的 Agent
        Server， 该 Agent Server 启动后会下载 v2ray 并启动 v2ray 服务，同时会监测是否连续 10
        分钟都没有客户端 Ping 通信。如果连续 10 分钟无客户端通信，调用腾讯云 API 销毁当前主机。
      </p>
      <TextArea className='mt-2 resize-none' value={shell} readOnly rows={6} />
      <div className='mt-4 flex items-center justify-end gap-2'>
        <Button
          onClick={() => {
            void copyToClipboard(shell).then(() => {
              void message.success('已复制！');
            });
          }}
          type='primary'
        >
          复制
        </Button>
        <Button
          onClick={() => {
            onClose();
          }}
        >
          关闭
        </Button>
      </div>
    </>
  );
};
export const Export: FC = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Tooltip title='查看安装 V2Ray 脚本'>
        <Button
          onClick={() => setOpen(true)}
          className='ml-4 translate-y-1 text-2xl'
          icon={<span className='icon-[mdi--bash]'></span>}
          type='link'
        />
      </Tooltip>
      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        footer={false}
        title='V2Ray Agent 脚本'
        destroyOnClose
      >
        <ExportInner onClose={() => setOpen(false)} />
      </Modal>
    </>
  );
};
