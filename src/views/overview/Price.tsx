import { Button } from 'antd';
import { useEffect, useState, type FC } from 'react';
import type { CVMPrice } from '@/service/tencent';
import { InquiryPriceRunInstances } from '@/service/tencent';
import { globalStore } from '@/store/global';

export const Price: FC = () => {
  const [price, setPrice] = useState<CVMPrice>();
  const [settings] = globalStore.useStore('settings');
  const [loading, setLoading] = useState(false);
  const loadPrice = async () => {
    setLoading(true);

    const [err, res] = await InquiryPriceRunInstances();
    setLoading(false);
    if (!err) {
      setPrice(res.Price);
    }
  };
  useEffect(() => {
    void loadPrice();
  }, [settings.instanceType]);

  return (
    <div className='flex items-center gap-2'>
      <span className='whitespace-nowrap'>当前价格：</span>
      {price && (
        <>
          <span className='whitespace-nowrap'>
            ¥{price.InstancePrice.UnitPriceDiscount.toFixed(2)}/小时
          </span>
          <span className='whitespace-nowrap'>¥{price.BandwidthPrice.UnitPriceDiscount}/GB</span>
        </>
      )}
      <Button
        loading={loading}
        className='relative translate-y-[1.5px]'
        onClick={() => {
          void loadPrice();
        }}
        icon={<span className='icon-[ant-design--reload-outlined]'></span>}
        size='small'
        type='link'
      ></Button>
    </div>
  );
};
