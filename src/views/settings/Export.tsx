import { App, Button, Modal, Tooltip } from 'antd';
import TextArea from 'antd/es/input/TextArea';
import { useMemo, useState, type FC } from 'react';
import { getInstanceAgentShell } from '@/service/instance';
import { copyToClipboard } from '@/service/util';

export const ExportInner: FC<{ onClose: () => void }> = ({ onClose }) => {
  const shell = useMemo(() => getInstanceAgentShell(), []);
  const { message } = App.useApp();

  return (
    <>
      <TextArea className='mt-4 resize-none' value={shell} readOnly rows={15} />
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
      <Tooltip title='导出 Shell 脚本'>
        <Button
          onClick={() => setOpen(true)}
          icon={<span className='icon-[ant-design--export-outlined]'></span>}
          type='link'
        />
      </Tooltip>
      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        footer={false}
        title='Agent 启动 Shell 脚本'
        destroyOnClose
      >
        <ExportInner onClose={() => setOpen(false)} />
      </Modal>
    </>
  );
};
