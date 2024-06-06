import type { ApiFilter } from './tencent';
import {
  CreateSecurityGroupWithPolicies,
  CreateSubnet,
  CreateVpc,
  DescribeSecurityGroups,
  DescribeSubnets,
  DescribeVpcs,
} from './tencent';
import { renderTpl } from './util';
import { message } from './message';
import { globalStore } from '@/store/global';
import shellTpl from '@/assets/shell-template/agent.sh?raw';

export interface InstanceDeps {
  vpcId: string;
  subnetId: string;
  sgId: string;
}

const params = (n: string, v: string, ...more: ApiFilter[]) => ({
  Filters: [{ Name: `${n}-name`, Values: [v] }, ...more],
});

async function loadVpc(resourceName: string) {
  const [err, res] = await DescribeVpcs(params('vpc', resourceName));
  if (err) return;
  if (!res.VpcSet.length) {
    const [err, res] = await CreateVpc({ VpcName: resourceName, CidrBlock: '10.0.0.0/12' });
    if (err) return;
    return res.Vpc;
  } else {
    return res.VpcSet[0];
  }
}

export async function loadInstanceDependentResources(): Promise<InstanceDeps | undefined> {
  const settings = globalStore.get('settings');
  if (!settings.zone || !settings.imageId) {
    void message.error('请先配置可用区、镜像等信息');
    return;
  }
  const resourceName = settings.resourceName;

  const [vpc, b, c] = await Promise.all([
    loadVpc(resourceName),
    DescribeSubnets(params('subnet', resourceName, { Name: 'zone', Values: [settings.zone] })),
    DescribeSecurityGroups(params('security-group', resourceName)),
  ]);
  if (!vpc || b[0] || c[0]) {
    return;
  }
  let subnet = b[1].SubnetSet[0];
  if (!subnet) {
    const [err, res] = await CreateSubnet({
      VpcId: vpc.VpcId,
      SubnetName: resourceName,
      Zone: settings.zone,
      CidrBlock: '10.8.0.0/16',
    });
    if (err || !res.Subnet) return;
    subnet = res.Subnet;
  }
  let sg = c[1].SecurityGroupSet[0];
  if (!sg) {
    const [err, res] = await CreateSecurityGroupWithPolicies({
      GroupName: resourceName,
      GroupDescription: 'v2ray',
      SecurityGroupPolicySet: {
        Egress: [
          {
            Protocol: 'ALL',
            Port: 'all',
            Action: 'ACCEPT',
            CidrBlock: '0.0.0.0/0',
          },
        ],
        Ingress: [
          {
            Protocol: 'TCP',
            Port: '22',
            Action: 'ACCEPT',
            CidrBlock: '0.0.0.0/0',
            PolicyDescription: 'SSH',
          },
          {
            Protocol: 'TCP',
            Port: '2080,2081',
            Action: 'ACCEPT',
            CidrBlock: '0.0.0.0/0',
            PolicyDescription: 'v2ray',
          },
        ],
      },
    });
    if (err || !res.SecurityGroup) return;
    sg = res.SecurityGroup;
  }
  return {
    vpcId: vpc.VpcId,
    subnetId: subnet.SubnetId,
    sgId: sg.SecurityGroupId,
  };
}

export function getInstanceAgentShell() {
  const settings = globalStore.get('settings');
  return renderTpl(shellTpl, {
    secretKey: settings.secretKey,
    secretId: settings.secretId,
    resourceName: settings.resourceName,
    token: settings.token,
    region: settings.region,
  });
}
