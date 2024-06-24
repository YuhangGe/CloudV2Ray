import { invoke } from '@tauri-apps/api/core';
import { Dropdown } from 'antd';
import type { ReactNode, FC } from 'react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export function renderContextMenuItem(label: string, icon?: ReactNode) {
  return (
    <div className='flex items-center gap-3 py-2 pl-1 pr-2'>
      {icon && <span className='translate-y-0.5'>{icon}</span>}
      {label}
    </div>
  );
}
export const ContextMenu: FC = () => {
  const [open, setOpen] = useState(false);
  const el = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handle = (ev: MouseEvent) => {
      console.log((ev.target as HTMLInputElement).tagName);
      if (ev.target.tagName === 'INPUT') return;
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
            label: renderContextMenuItem(
              '重新加载',
              <span className='icon-[ant-design--reload-outlined]'></span>,
            ),
            key: 'reload',
          },
          {
            label: renderContextMenuItem(
              '开发面板',
              <span className='icon-[oui--app-devtools]'></span>,
            ),
            key: 'dev',
          },
          {
            type: 'divider',
          },
          {
            label: renderContextMenuItem(
              '退出程序',
              <span className='icon-[grommet-icons--power-shutdown]'></span>,
            ),
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
