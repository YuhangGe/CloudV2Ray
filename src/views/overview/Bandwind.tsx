import { App, Button, InputNumber, Modal, Tag, Tooltip } from 'antd';
import { type FC, useState } from 'react';
import { globalStore } from '@/store/global';
import { isNumber } from '@/service/util';
import { ResetInstancesInternetMaxBandwidth } from '@/service/tencent';

export const Bandwidth: FC = () => {
  const [inst, setInst] = globalStore.useStore('instance');
  const [settings, setSettings] = globalStore.useStore('settings');
  const { message } = App.useApp();
  const [v, setV] = useState(
    inst?.InternetAccessible?.InternetMaxBandwidthOut ?? settings.bandWidth ?? 1,
  );
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submit = async () => {
    if (!inst || v === inst.InternetAccessible?.InternetMaxBandwidthOut) {
      setOpen(false);
      return;
    }
    setSubmitting(true);
    const [err] = await ResetInstancesInternetMaxBandwidth(inst.InstanceId, v);
    setSubmitting(false);
    if (!err) {
      void message.success('更新带宽大小成功！');
      setInst({
        ...inst,
        InternetAccessible: {
          ...inst.InternetAccessible,
          InternetMaxBandwidthOut: v,
        },
      });
      setSettings({
        ...settings,
        bandWidth: v,
      });
      setOpen(false);
    }
  };
  return (
    <div className='flex items-center gap-2'>
      <span>公网带宽：</span>
      {inst?.InternetAccessible ? (
        <>
          <span>
            {inst.InternetAccessible.InternetMaxBandwidthOut}
            <span className='ml-0.5'>Mbps</span>
          </span>

          <Tooltip title='调整带宽大小'>
            <Button
              onClick={() => {
                setV(inst.InternetAccessible.InternetMaxBandwidthOut ?? settings.bandWidth ?? 1);
                setOpen(true);
              }}
              className='translate-y-[1.5px] text-lg'
              icon={<span className='icon-[tdesign--arrow-up-down-3]'></span>}
              type='link'
              size='small'
            />
          </Tooltip>
          <Modal
            open={open}
            onCancel={() => {
              if (submitting) return;
              setOpen(false);
            }}
            okButtonProps={{
              loading: submitting,
            }}
            title='调整公网带宽大小'
            onOk={() => {
              void submit();
            }}
          >
            <p className='pb-1 pt-2 text-xs text-secondary-text'>
              当前版本公网IP按使用流量计费，带宽大小不直接影响费用。
            </p>
            <div className='flex items-center'>
              <label>带宽大小：</label>
              <InputNumber
                value={v}
                onChange={(v) => {
                  if (isNumber(v)) {
                    setV(v);
                  }
                }}
                min={1}
                max={1000}
              />
            </div>
          </Modal>
        </>
      ) : settings.bandWidth ? (
        <Tag>{settings.bandWidth}Mbps</Tag>
      ) : (
        <Tag>-</Tag>
      )}
    </div>
  );
};
