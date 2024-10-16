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
  region: 'ap-singapore',
  instanceType: '',
  token: '',
  loginPwd: '',
  imageType: 'PRIVATE_IMAGE',
  imageId: '',
  zone: '',
  resourceName: 'vray::proxy',
  bandWidth: 1,
  secretKey: import.meta.env.VITE_SECRET_KEY ?? '',
  secretId: import.meta.env.VITE_SECRET_ID ?? '',
};
