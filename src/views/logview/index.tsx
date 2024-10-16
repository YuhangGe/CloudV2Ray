import { type FC, useEffect, useRef } from 'react';
import { logStore } from '@/store/log';

const LogView: FC = () => {
  const [logs] = logStore.useStore('logs');
  const el = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!el.current) return;
    el.current.scroll({ behavior: 'smooth', top: el.current.scrollHeight });
  }, [logs]);
  return (
    <div className='mb-4 mt-3 flex-1 overflow-y-auto' ref={el}>
      {logs.map((log) => (
        <p className='mb-0.5 font-mono leading-[1.2] text-secondary-text' key={log.id}>
          {log.text}
        </p>
      ))}
    </div>
  );
};

export default LogView;
