import { App, Button, Form, Input, InputNumber, Select } from 'antd';
import { useEffect, useState, type FC } from 'react';
import type { DefaultOptionType } from 'antd/es/select';
import { invoke } from '@tauri-apps/api/core';
import { Price } from '../overview/Price';
import { Export } from './Export';
import type { Settings } from '@/service/settings';
import { globalStore } from '@/store/global';
import { DescribeImages, DescribeInstanceTypeConfigs, DescribeZones } from '@/service/tencent';
import { generateStrongPassword } from '@/service/util';
import { RegionOptions } from '@/service/region';

export const SettingsView: FC = () => {
  const [form] = Form.useForm<Settings>();
  const [settings, setSettings] = globalStore.useStore('settings');
  const [region, setRegion] = useState(settings.region);
  useEffect(() => {
    setRegion(settings.region);
  }, [settings.region]);

  const { message } = App.useApp();
  const save = () => {
    form.validateFields().then(
      (data) => {
        setSettings((old) => ({ ...old, ...data }));
        void message.success('配置已保存！');
      },
      (err) => {
        console.error(err);
      },
    );
  };

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

  // const [tab, setTab] = useQuery('tab', 'api');
  // const items = useMemo(
  //   () => [
  //     {
  //       label: '腾讯云 API 参数',
  //       key: 'api',
  //     },
  //     {
  //       label: '代理主机参数',
  //       key: 'inst',
  //     },
  //   ],
  //   [],
  // );

  const resetToken = () =>
    invoke('tauri_generate_uuid').then(
      (id) => {
        form.setFieldValue('token', id);
      },
      (err) => {
        void message.error(`${err}`);
      },
    );
  const resetPwd = () => form.setFieldValue('loginPwd', generateStrongPassword());

  useEffect(() => {
    if (!settings.token) {
      void resetToken();
    }
    if (!settings.loginPwd) {
      resetPwd();
    }
  }, []);
  return (
    <div className='flex flex-1 flex-col overflow-x-hidden px-6 pt-6'>
      <div className='mb-4 flex items-center'>
        <div className='mr-4 text-2xl font-medium'>配置</div>
        <Export />
      </div>
      {/* <Tabs activeKey={tab} onChange={(t) => setTab(t)} items={items}></Tabs> */}

      <Form
        form={form}
        initialValues={settings}
        className='max-w-md'
        labelCol={{ span: 5 }}
        labelAlign='left'
      >
        <Form.Item label='Secret Id' name='secretId' required rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item label='Secret Key' name='secretKey' required rules={[{ required: true }]}>
          <Input />
        </Form.Item>
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
        <Form.Item label='令牌' name='token' required rules={[{ required: true }]}>
          <Input
            readOnly
            addonAfter={
              <Button
                onClick={() => {
                  void resetToken();
                }}
                size='small'
                type='text'
              >
                生成
              </Button>
            }
          />
        </Form.Item>
        <Form.Item label='登录密码' name='loginPwd' required rules={[{ required: true }]}>
          <Input
            readOnly
            addonAfter={
              <Button
                onClick={() => {
                  resetPwd();
                }}
                size='small'
                type='text'
              >
                生成
              </Button>
            }
          />
        </Form.Item>
        <div className='flex items-center gap-8'>
          <Button
            type='primary'
            onClick={() => {
              save();
            }}
          >
            保存
          </Button>
          {settings.zone && <Price />}
        </div>
      </Form>
    </div>
  );
};
