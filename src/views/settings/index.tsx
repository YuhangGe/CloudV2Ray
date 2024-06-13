import { App, Button, ConfigProvider, Form, Input, Tabs, Tooltip } from 'antd';
import { useEffect, useMemo, type FC } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Price } from '../overview/Price';
import { InstancePanel } from './Instance';
import type { Settings } from '@/service/settings';
import { globalStore } from '@/store/global';
import { copyToClipboard, generateStrongPassword, useQuery } from '@/service/util';
import { themeStore } from '@/store/theme';

const SettingsView: FC = () => {
  const [form] = Form.useForm<Settings>();
  const [settings, setSettings] = globalStore.useStore('settings');
  const [underSm] = themeStore.useStore('underSm');
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
    <ConfigProvider
      theme={{
        components: {
          Form: {
            marginLG: underSm ? 12 : 24,
          },
        },
      }}
    >
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
        scrollToFirstError
        initialValues={settings}
        className='max-w-md overflow-y-auto pb-4 max-sm:max-w-full'
        labelCol={{ span: 5 }}
        labelAlign='left'
      >
        {tab === 'secret' && (
          <>
            <Form.Item label='Secret Id' name='secretId' required rules={[{ required: true }]}>
              <Input
                onFocus={(evt) => {
                  setTimeout(() => evt.target.select());
                }}
              />
            </Form.Item>
            <Form.Item label='Secret Key' name='secretKey' required rules={[{ required: true }]}>
              <Input
                onFocus={(evt) => {
                  setTimeout(() => evt.target.select());
                }}
              />
            </Form.Item>
            <Form.Item label='VMess Id' name='token' required rules={[{ required: true }]}>
              <Input
                className='cursor-pointer [&_.ant-input-group-addon]:p-0'
                onFocus={(evt) => {
                  setTimeout(() => evt.target.select());
                }}
                addonAfter={
                  <Button.Group size='small'>
                    <Tooltip title='生成 UUID'>
                      <Button
                        onClick={() => {
                          void resetToken();
                        }}
                        icon={<span className='icon-[ant-design--reload-outlined]'></span>}
                        type='link'
                      ></Button>
                    </Tooltip>
                    <Button
                      onClick={() => {
                        const tk = form.getFieldValue('token');
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
        )}
        {tab === 'instance' && <InstancePanel form={form} />}
      </Form>
      <div className='my-4 flex items-center gap-8'>
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
    </ConfigProvider>
  );
};

export default SettingsView;
