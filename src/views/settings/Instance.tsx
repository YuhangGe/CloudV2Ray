import type { FormInstance } from 'antd';
import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { App, Button, Form, Input, InputNumber, Select, Tooltip } from 'antd';
import type { DefaultOptionType } from 'antd/es/select';
import type { Settings } from '@/service/settings';
import { globalStore } from '@/store/global';
import { DescribeImages, DescribeInstanceTypeConfigs, DescribeZones } from '@/service/tencent';
import { copyToClipboard, generateStrongPassword } from '@/service/util';
import { RegionOptions } from '@/service/region';

export const InstancePanel: FC<{
  form: FormInstance<Settings>;
}> = ({ form }) => {
  const [settings] = globalStore.useStore('settings');
  const { message } = App.useApp();
  const [region, setRegion] = useState(settings.region);
  useEffect(() => {
    setRegion(settings.region);
  }, [settings.region]);
  const [zoneOptions, setZoneOptions] = useState<DefaultOptionType[]>([]);
  const [instTypeOptions, setInstTypeOptions] = useState<DefaultOptionType[]>([]);
  useEffect(() => {
    setZoneOptions([]);
    void DescribeZones({
      region,
    }).then(([err, res]) => {
      if (!err) {
        setZoneOptions(
          res.ZoneSet.map((zone) => ({
            label: zone.ZoneName,
            value: zone.Zone,
          })),
        );
      }
    });
  }, [region]);

  const zone = Form.useWatch(['zone'], form);
  useEffect(() => {
    if (!region || !zone) {
      setInstTypeOptions([]);
      return;
    }
    void DescribeInstanceTypeConfigs({
      region,
      Filters: [
        {
          Name: 'zone',
          Values: [zone],
        },
      ],
    }).then(([err, res]) => {
      if (!err) {
        const arr = res.InstanceTypeConfigSet.sort((a, b) => {
          if (a.CPU === b.CPU) return a.Memory - b.Memory;
          return a.CPU - b.CPU;
        });
        setInstTypeOptions(
          arr.map((instType) => ({
            label: `${instType.InstanceType}(${instType.CPU} CPU, ${instType.Memory} GB)`,
            value: instType.InstanceType,
          })),
        );
      }
    });
  }, [region, zone]);

  const [imageOptions, setImageOptions] = useState<DefaultOptionType[]>([]);
  useEffect(() => {
    void DescribeImages({
      region,
      Filters: [
        {
          Name: 'image-type',
          Values: ['PUBLIC_IMAGE'],
        },
        {
          Name: 'platform',
          Values: ['Ubuntu'],
        },
      ],
    }).then(([err, res]) => {
      if (!err) {
        setImageOptions(
          res.ImageSet.map((image) => ({
            label: image.ImageName,
            value: image.ImageId,
          })),
        );
      }
    });
  }, [region]);
  const resetPwd = () => form.setFieldValue('loginPwd', generateStrongPassword());

  useEffect(() => {
    if (!settings.loginPwd) {
      resetPwd();
    }
  }, []);
  return (
    <>
      <Form.Item label='区域' name='region' required rules={[{ required: true }]}>
        <Select
          options={RegionOptions}
          onChange={(v) => {
            form.setFieldValue('zone', '');
            form.setFieldValue('instanceType', '');
            setRegion(v);
          }}
        />
      </Form.Item>
      <Form.Item label='可用区' name='zone' required rules={[{ required: true }]}>
        <Select options={zoneOptions} />
      </Form.Item>
      <Form.Item label='规格' name='instanceType' required rules={[{ required: true }]}>
        <Select options={instTypeOptions} />
      </Form.Item>
      <Form.Item label='资源名' name='resourceName' required rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item label='镜像' name='imageId' required rules={[{ required: true }]}>
        <Select options={imageOptions} placeholder='选择镜像' />
      </Form.Item>
      <Form.Item label='带宽' name='bandWidth' required rules={[{ required: true }]}>
        <InputNumber className='w-full' min={1} max={10} />
      </Form.Item>

      <Form.Item label='登录密码' name='loginPwd' required rules={[{ required: true }]}>
        <Input
          className='cursor-pointer [&_.ant-input-group-addon]:p-0'
          onFocus={(evt) => {
            setTimeout(() => evt.target.select());
          }}
          addonAfter={
            <Button.Group size='small'>
              <Tooltip title='生成密码'>
                <Button
                  onClick={() => {
                    resetPwd();
                  }}
                  icon={<span className='icon-[ant-design--reload-outlined]'></span>}
                  type='link'
                ></Button>
              </Tooltip>
              <Button
                onClick={() => {
                  const tk = form.getFieldValue('loginPwd');
                  if (tk) {
                    void copyToClipboard(tk).then(() => {
                      void message.success('已复制！');
                    });
                  }
                }}
                type='link'
                icon={<span className='icon-[ant-design--copy-outlined]'></span>}
              />
            </Button.Group>
          }
        />
      </Form.Item>
    </>
  );
};
