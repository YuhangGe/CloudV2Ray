# CloudV2Ray

> 基于云服务的跨平台 V2Ray 客户端，支持 MacOS/Windows/Android。

## 原理

借助云服务（比如腾讯云）提供的 Open API，全自动购买外网地域（比如美国硅谷）的主机并安装 `v2ray` 服务，并在本地（PC或手机）上启动 `v2ray` 和服务器连接。

云主机上同时会启动一个 Agent，连续 10 分钟没有客户端连接则自动调用云服务 Open API 销毁主机，节省成本。

## 成本

主流云厂商都提供了[竞价实例(抢占式实例)](https://cloud.tencent.com/document/product/213/17816?from_cn_redirect=1)，这一类的实例非常便宜。同时，公网带宽可选择按流量计费，搭配通过[规则(gfwlist)](https://raw.githubusercontent.com/aglent/autoproxy/master/gfwlist.pac)按需代理，可最大程度节省成本；因为是按流量计费，公网带宽可调整为 10Mbps 以上，保证网速。

以腾讯云在 2024 年 6 月为例，美国硅谷二区的低配规格（CPU2核，内存2GB，磁盘20GB）竞价实例，价格最低到 0.04元/小时，公网价格为 0.32元/GB。

## 使用

1. 登录腾讯云，完成实名认证，并在[访问管理](https://console.cloud.tencent.com/cam)中添加一个子账号。务必注意创建账号时要勾选`编程访问`，创后后将下载的`SecretKey`和`SecretId`妥善保管。
2. 为这个子账号添加以下权限：
   - `QcloudTATFullAccess` 自动化助手（TAT）全读写访问权限。
   - `QcloudCVMFinanceAccess` 云服务器（CVM）财务权限。
   - `QcloudCVMFullAccess` 云服务器（CVM）全读写访问权限。
3. 启动 `CloudV2Ray` 客户端，在 `配置` 页填写第二步得到的 `SecretKey` 和 `SecretId` 。
4. 在配置页填写想要购买的主机配置，保存后会展示价格。推荐选择美国硅谷的可用区2，可以切换不同地域，选择不同的实例规格，保存后查看价格并进行横向比对，选择最便宜的。
5. 切换到`主机`页，点击`创建实例`，然后耐心等待直到提示 `v2ray` 服务启动成功。

此外，第 5 步完成后，推荐在 Edge/Chrome 中使用 [SwitchyOmega](https://github.com/FelisCatus/SwitchyOmega) 扩展搭配[AutoProxy自动切换规则](https://github.com/aglent/autoproxy) 来按需代理。未安装该插件前可在概览页打开系统代理开关后访问 Google。

`注意：`

- 竞价实例可能被回收。如果发现科学网络中断了，可在`主机`页刷新下实例信息（会变回无实例），然后创建。
- 如果发现网络异常，比如卡顿一类的，可主动点击`销毁实例`后重新创建实例。

## Develop

### 环境准备

主要是根据 [tauri](https://v2.tauri.app/start/prerequisites/#configure-for-mobile-targets) 的[官方提示](https://v2.tauri.app/start/prerequisites/#configure-for-mobile-targets)安装研发环境。安卓开发需要正确安装好 Android Studio。

NDK 可能有多个版本，配置环境变量时和官方提示有些差异。MacOS 上可参考以下配置：

```bash
# 以下内容配置到 ~/.zshrc 或 ~/.bashrc
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
export ANDROID_HOME="$HOME/Library/Android/sdk"
export NDK_HOME="$ANDROID_HOME/ndk/$(ls -1 $ANDROID_HOME/ndk | sort -r | head -1)"
export PATH="$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools:$NDK_HOME"

# 注意要把通过 Homebrew 安装的 openssl 的目录配置对。可通过 brew info openssl 查看。
export OPENSSL_DIR="/opt/homebrew/Cellar/openssl@3/3.3.1"
```

最后，在适当目录 `git clone` 当前项目。

3. 在 `src-tauri/gen/android/app` 下执行 `git clone --recursive https://github.com/heiher/hev-socks5-tunnel jni`

### 桌面（MacOS/Windows）开发

在 `src-tauri` 目录下新建 `resources` 目录，并将 `v2ray-macos-arm64.zip`, `v2ray-macos-x64.zip`, `v2ray-windows-x64.zip` 文件下载后放入该目录。请从 v2ray-core 官方 github releases 下载对应文件。

打开一个 Terminal，在项目根目录下执行 `pnpm dev`，这一步是启动前端 vite。

同时再打开一个 Terminal，在 `src-tauri` 目录下执行 `cargo run`。

### 移动（Android）开发

先准备 v2ray core，其安卓版可直接被当作可执行文件在 shell 中执行：

在 `src-tauri/gen/android/` 中新建 `libs/arm64-v8a` 目录，然后从 v2ray 官方 github releases 上下载安卓包，解压后，将 `v2ray` 可执行文件重命名为 `libv2ray.so`，然后拷贝到 `src-tauri/gen/android/libs/arm64-v8a` 中；将 `geoip.dat` 和 `geosite.dat` 两个文件，拷贝到 `src-tauri/gen/android/app/src/main/assets` 目录中。

然后准备 [hev-socks5-tunnel](https://github.com/heiher/hev-socks5-tunnel) 这个依赖库，这个库作用是将 vpn 劫持的流量转成 socks5 协议然后转发给 v2ray，从而实现 vpn 转 proxy 的作用：

参考仓库 README 中的指导编译安卓库，将编译后得到的 `hev-socks5-tunnel/libs/arm64-v8a/libhev-socks5-tunnel.so` 文件拷贝到当前项目的 `src-tauri/gen/android/libs/arm64-v8a` 目录中。

打开一个 Terminal，在项目根目录下执行 `pnpm dev`，这一步是启动前端 vite。

同时再打开一个 Terminal，在项目根目录执行 `pnpm tauri android dev`。

首次启动成功后，后续如果只是改安卓代码，可直接在 Android Studio 中修改后重新运行即可调试。如果修改了 rust 代码或其它配置，需要重新执行 `pnpm tauri android dev`。

## Todos

- 支持阿里云。
- 支持一键自动获取最低价资源（扫描所有地域所有规格的价格）。
- 支持更新 v2ray-core。
- 支持 IOS
- 支持公网按流量计费外的其它方式；支持绑定独立购买的弹性 IP。
