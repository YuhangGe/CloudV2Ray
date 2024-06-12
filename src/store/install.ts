import { createStore } from 'lrhs';
import { globalStore } from './global';
import type { LoadingMessage } from '@/service/util';
import { loadingMessage } from '@/service/util';
import { loadInstanceDependentResources } from '@/service/instance';
import type { CVMInstance } from '@/service/tencent';
import { CreateInstance } from '@/service/tencent';
import {
  installV2RayAgent,
  pingV2RayInterval,
  startV2RayCore,
  waitInstanceAutomationAgentReady,
  waitInstanceReady,
} from '@/views/instance/helper';

export interface InstallStore {
  installing: boolean;
  installed: boolean;
}

export const installStore = createStore<InstallStore>({
  installing: false,
  installed: false,
});

export const createInstanceAndInstallV2Ray = async (options?: { onEnd: () => void }) => {
  const msg = loadingMessage('正在创建主机...');

  const final = () => {
    installStore.set('installing', false);
    msg.close();
    options?.onEnd();
  };
  installStore.set('installing', true);
  const deps = await loadInstanceDependentResources();
  if (!deps) {
    return final();
  }
  const [err, res] = await CreateInstance(deps);
  if (err) return final();
  globalStore.set('instance', res);
  msg.update('正在等待主机启动...');
  const instWithEip = await waitInstanceReady(res);
  globalStore.set('instance', instWithEip);
  await installV2RayAgentOnInstance(instWithEip, msg);
};

export const installV2RayAgentOnInstance = async (inst: CVMInstance, msg?: LoadingMessage) => {
  if (!msg) {
    msg = loadingMessage('正在等待远程主机自动化助手上线...');
  } else {
    msg.update('正在等待远程主机自动化助手上线...');
  }
  await waitInstanceAutomationAgentReady(inst);
  msg.update('正在远程主机上安装 V2Ray...');
  const x = await installV2RayAgent(inst);
  installStore.set('installing', false);
  if (!x) {
    msg.end('远程主机安装 V2Ray 失败！请尝试重新安装。', 'error');
  } else {
    installStore.set('installed', true);
    void pingV2RayInterval();
    void startV2RayCore();
    msg.end('远程主机安装 V2Ray 完成，已启动本地 v2ray-core 代理！');
  }
};
