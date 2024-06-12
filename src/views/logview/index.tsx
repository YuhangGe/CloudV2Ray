import { useEffect, useRef, type FC } from 'react';
import { logStore } from '@/store/log';

const LogView: FC = () => {
  const [logs] = logStore.useStore('logs');
  const el = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!el.current) return;
    el.current.scroll({ behavior: 'smooth', top: el.current.scrollHeight });
  }, [logs]);
  return (
    <div className='relative flex flex-1 flex-col overflow-x-hidden px-6 py-5'>
      <div className='mb-7 mr-4 mt-1 text-2xl font-medium'>日志</div>
      <div className='flex-1 overflow-y-auto' ref={el}>
        {logs.map((log) => (
          <p className='mb-0.5 font-mono leading-[1.2] text-secondary-text' key={log.id}>
            {log.text}
          </p>
        ))}
      </div>
    </div>
  );
};

export default LogView;
