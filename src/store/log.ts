import { createStore } from 'lrhs';
import { uid } from '@/service/util';

export interface Log {
  id: string;
  text: string;
}
export interface LogStore {
  logs: Log[];
}
export const logStore = createStore<LogStore>({
  logs: [],
});

export const MAX_LOGS_LENGTH = 1000;

export function appendLog(log: string) {
  // eslint-disable-next-line no-console
  console.log(log);
  logStore.set('logs', (oldLogs) => {
    const newLogs = oldLogs.slice();
    newLogs.push({ id: uid(), text: log });
    if (newLogs.length > MAX_LOGS_LENGTH) {
      newLogs.unshift();
    }
    return newLogs;
  });
}
