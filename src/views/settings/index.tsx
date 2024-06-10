import { App, Button, Form, Input, Tabs } from 'antd';
import { useEffect, useMemo, type FC } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Price } from '../overview/Price';
import { Export } from './Export';
import { InstancePanel } from './Instance';
import type { Settings } from '@/service/settings';
import { globalStore } from '@/store/global';
import { copyToClipboard, generateStrongPassword, useQuery } from '@/service/util';

export const SettingsView: FC = () => {
  const [form] = Form.useForm<Settings>();
  const [settings, setSettings] = globalStore.useStore('settings');

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

  const [tab, setTab] = useQuery('tab', settings.secretKey ? 'instance' : 'secret');
  const items = useMemo(
    () => [
      {
        label: '密钥参数',
        key: 'secret',
      },
      {
        label: '主机参数',
        key: 'instance',
      },
    ],
    [],
  );

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
        {settings.secretKey && <Export />}
      </div>
      <Tabs
        activeKey={tab}
        onChange={(t) => {
          if (t !== 'secret' && !settings.secretKey) {
            void message.error('请先填写密钥信息');
          } else {
            setTab(t);
          }
        }}
        items={items}
      ></Tabs>

      <Form
        form={form}
        initialValues={settings}
        className='max-w-md'
        labelCol={{ span: 5 }}
        labelAlign='left'
      >
        {tab === 'secret' && (
          <>
            <Form.Item label='Secret Id' name='secretId' required rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item label='Secret Key' name='secretKey' required rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item label='VMess Id' name='token' required rules={[{ required: true }]}>
              <Input
                className='cursor-pointer'
                onFocus={() => {
                  const tk = form.getFieldValue('token');
                  if (tk) {
                    void copyToClipboard(tk).then(() => {
                      void message.success('已复制！');
                    });
                  }
                }}
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
          </>
        )}
        {tab === 'instance' && <InstancePanel form={form} />}
        <div className='flex items-center gap-8'>
          <Button
            type='primary'
            onClick={() => {
              save();
            }}
          >
            保存
          </Button>
          {tab === 'instance' && settings.instanceType && <Price />}
        </div>
      </Form>
    </div>
  );
};
