export interface Settings {
  resourceName: string;
  instanceType: string;
  imageId: string;
  imageType: 'PUBLIC_IMAGE' | 'PRIVATE_IMAGE';
  zone: string;
  region: string;
  secretKey: string;
  secretId: string;
  loginPwd: string;
  bandWidth: number;
  token: string;
}
export const DefaultSettings: Settings = {
  region: import.meta.env.VITE_SETTING_REGION ?? 'ap-singapore',
  instanceType: import.meta.env.VITE_SETTING_INSTANCETYPE ?? '',
  token: import.meta.env.VITE_VMESS_ID ?? '',
  loginPwd: import.meta.env.VITE_SETTING_PASSWORD ?? '',
  imageType: 'PRIVATE_IMAGE',
  imageId: '',
  zone: import.meta.env.VITE_SETTING_ZONE ?? '',
  resourceName: 'vray::proxy',
  bandWidth: 10,
  secretKey: import.meta.env.VITE_SECRET_KEY ?? '',
  secretId: import.meta.env.VITE_SECRET_ID ?? '',
};
