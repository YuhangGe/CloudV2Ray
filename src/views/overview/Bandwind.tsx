import { Button, Tag, Tooltip } from 'antd';
import type { FC } from 'react';
import type { CVMInstance } from '@/service/tencent';

export const Bandwidth: FC<{ inst: CVMInstance }> = ({ inst }) => {
  return (
    <div className='flex items-center gap-2'>
      <span>公网带宽：</span>
      <Tag>{inst.InternetAccessible.InternetMaxBandwidthOut}Mbps</Tag>
      {inst && (
        <Tooltip title='调整带宽大小'>
          <Button
            className='translate-y-[1.5px] text-lg'
            icon={<span className='icon-[tdesign--arrow-up-down-3]'></span>}
            type='link'
            size='small'
          />
        </Tooltip>
      )}
    </div>
  );
};
