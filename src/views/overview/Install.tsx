import { Button } from 'antd';
import { useEffect, useRef, useState, type FC } from 'react';
import { getInstanceAgentShell } from '@/service/instance';
import type { CVMInstance } from '@/service/tencent';
import { CreateCommand, DescribeCommands, InvokeCommand, ModifyCommand } from '@/service/tencent';
import { globalStore } from '@/store/global';
import { message } from '@/service/message';

async function createOrUpdateCommand(shellContent: string) {
  const [e0, r1] = await DescribeCommands({
    Filters: [{ Name: 'command-name', Values: ['v2ray_agent'] }],
  });
  if (e0) return;
  let id = r1.CommandSet[0]?.CommandId;
  if (id) {
    const [err] = await ModifyCommand({
      CommandId: id,
      Content: shellContent,
    });
    if (err) return;
  } else {
    const [err, res] = await CreateCommand({
      CommandName: 'v2ray_agent',
      WorkingDirectory: '/home/ubuntu',
      Username: 'ubuntu',
      Timeout: 600,
      Content: shellContent,
    });
    if (err) return;
    id = res.CommandId;
  }
  return id;
}
async function ping(inst: CVMInstance) {
  const settings = globalStore.get('settings');
  if (!settings.token) return false;
  const ip = inst.PublicIpAddresses?.[0];
  if (!ip) return false;
  try {
    const res = await fetch(`http://${ip}:2081/ping`, {
      headers: {
        'X-Token': settings.token,
      },
    });
    if (res.status !== 200) {
      return false;
    }
    const text = await res.text();
    // console.log(text);
    return text === 'pong!';
  } catch (ex) {
    void message.error(`${ex}`);
    return false;
  }
}
export const Install: FC<{ instance: CVMInstance }> = ({ instance }) => {
  const [pinged, setPinged] = useState(true);
  const tick = useRef(0);
  useEffect(() => {
    void ping(instance).then((pinged) => {
      setPinged(pinged);
    });
    return () => {
      tick.current++;
    };
  }, [instance]);

  const [installing, setInstalling] = useState(false);
  const doInstall = async () => {
    setInstalling(true);
    const shellContent = window.btoa(getInstanceAgentShell());
    const commandId = await createOrUpdateCommand(shellContent);
    if (!commandId) {
      setInstalling(false);
      return;
    }
    await InvokeCommand({
      CommandId: commandId,
      InstanceIds: [instance.InstanceId],
    });
    const t = tick.current;
    for (let i = 0; ; i++) {
      await new Promise((res) => setTimeout(res, 1000));
      if (t !== tick.current) return;
      if (i < 10) continue;
      const pinged = await ping(instance);
      if (t !== tick.current) return;
      if (pinged) {
        setPinged(true);
        setInstalling(false);
        return;
      }
    }
  };

  return (
    <Button
      disabled={pinged}
      loading={installing}
      onClick={() => {
        void doInstall();
      }}
      className='text-xs'
      size='small'
    >
      安装 V2Ray
    </Button>
  );
};
