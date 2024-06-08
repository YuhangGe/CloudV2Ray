import { Button } from 'antd';
import { useEffect, useState, type FC } from 'react';
import type { CVMBalance } from '@/service/tencent';
import { DescribeAccountBalance } from '@/service/tencent';

export const Balance: FC = () => {
  const [price, setPrice] = useState<CVMBalance>();
  const [loading, setLoading] = useState(false);
  const loadPrice = async () => {
    setLoading(true);

    const [err, res] = await DescribeAccountBalance();
    setLoading(false);
    if (!err) {
      setPrice(res);
    }
  };
  useEffect(() => {
    void loadPrice();
  }, []);

  return (
    <div className='flex items-center gap-2'>
      <span className='whitespace-nowrap'>账户余额：</span>
      {price && (
        <>
          <span className='whitespace-nowrap'>¥{(price.CashAccountBalance / 100).toFixed(2)}</span>
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
