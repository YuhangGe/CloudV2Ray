import { App } from 'antd';
import type { MessageInstance } from 'antd/es/message/interface';
import type { FC } from 'react';
import { useEffect } from 'react';

let message: MessageInstance;
export const MessageWrapper: FC = () => {
  const app = App.useApp();

  useEffect(() => {
    message = app.message;
    return () => {
      message = undefined as unknown as MessageInstance;
    };
  }, []);
  return null;
};

export { message };
