import { invoke } from '@tauri-apps/api/core';
import { Dropdown } from 'antd';
import { useEffect, useRef, useState, type FC } from 'react';
import { createPortal } from 'react-dom';

export const ContextMenu: FC = () => {
  const [open, setOpen] = useState(false);
  const el = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handle = (ev: MouseEvent) => {
      ev.preventDefault();
      if (!el.current) return;
      el.current.style.left = `${ev.pageX}px`;
      el.current.style.top = `${ev.pageY}px`;
      setOpen(true);
    };
    document.addEventListener('contextmenu', handle);
    return () => {
      document.removeEventListener('contextmenu', handle);
    };
  }, []);

  return createPortal(
    <Dropdown
      open={open}
      trigger={['click']}
      onOpenChange={(v) => setOpen(v)}
      getPopupContainer={() => document.body}
      menu={{
        onClick(info) {
          if (info.key === 'quit') {
            void invoke('tauri_exit_process');
          } else if (info.key === 'dev') {
            void invoke('tauri_open_devtools');
          } else if (info.key === 'reload') {
            history.replaceState(null, '', '/');
            location.reload();
          }
        },
        items: [
          {
            label: '重新加载',
            key: 'reload',
          },
          {
            label: '开发面板',
            key: 'dev',
          },
          {
            type: 'divider',
          },
          {
            label: '退出',
            key: 'quit',
          },
        ],
      }}
    >
      <div className='fixed z-50 size-[1px]' ref={el}></div>
    </Dropdown>,
    document.body,
  );
};
