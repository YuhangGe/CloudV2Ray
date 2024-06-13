# CloudV2Ray

> 基于云服务的 V2Ray 客户端

## 背景

程序员都离不开科学上网访问 `google` 和 `stackoverflow` 等平台。一般有两个途径进行科学上网，一是购买现成的梯子，二是够买云主机自己搭建梯子。前者的问题是不稳定，经常有梯子的节点挂了，甚至服务商跑路的情况。后者的问题是往往成本比较大。

对于仅在职业中使用科学上网，而在生活中较少使用科学上网的轻度使用人群而言，不需要 7x24 小时持续使用，大部分时候都是在工作日的白天使用。

因此，有个稳定且省钱的科学上网方案是，在需要的时候（比如一天的工作开始时）购买云服务并搭建 `v2ray` 服务，在结束使用的时候（比如一天的工作结束时）销毁云服务器。

这套方案最大的问题是操作起来比较麻烦，不论是购买服务器还是搭建 `v2ray` 服务，都是重复费力的事情；此外，每次购买的云主机的公网 IP 也会变化，客户端也要重新配置。

为了解决上述问题，有了这个 `CloudV2Ray` 项目，提供一个基于云计算的 `v2ray` 客户端。

`CloudV2Ray` 使用云厂商（当前版本是腾讯云）提供的 API，可在 GUI 界面上快捷一键购买资源，并自动在新建的远程主机上安装 `v2ray` 服务；同时在本地也自动配置好 `v2ray` 的配置文件（远程主机的公网 IP 等信息），并在后台启动 `v2ray`，通过 `socks5://127.0.0.1:7890` 提供标准的代理服务。

## 成本

主流云厂商都提供了[竞价实例(抢占式实例)](https://cloud.tencent.com/document/product/213/17816?from_cn_redirect=1)，这一类的实例非常便宜。同时，公网带宽可选择按流量计费，搭配通过[规则(gfwlist)](https://raw.githubusercontent.com/aglent/autoproxy/master/gfwlist.pac)按需代理，可最大程度节省成本。

以腾讯云在 2024 年 6 月为例，美国硅谷二区的低配规格（CPU2核，内存2GB，磁盘20GB）竞价实例，价格最低到 0.04元/小时，公网价格为 0.32元/GB。公网带宽可根据需要灵活购买，可大可小，不直接影响价格。

## 使用

当前项目的定位是给职业软件工程师使用。因此除当前 README 外，不提供任何给小白的指导。你需要做如下操作：

1. 登录腾讯云，完成实名认证，并在[访问管理](https://console.cloud.tencent.com/cam)中添加一个子账号。务必注意创建账号时要勾选`编程访问`，创后后将下载的`SecretKey`和`SecretId`妥善保管。
2. 为这个子账号添加以下权限：
   - `QcloudTATFullAccess` 自动化助手（TAT）全读写访问权限。
   - `QcloudCVMFinanceAccess` 云服务器（CVM）财务权限。
   - `QcloudCVMFullAccess` 云服务器（CVM）全读写访问权限。
3. 下载并安装 `CloudV2Ray` 客户端。
   - `windows` 系统下载 zip 包后解压到心怡的存放目录即可。
   - `osx` 系统标准化安装到`应用`即可。
   - 安卓系统直接安装（规划中，待支持）。
   - 未规划支持 `linux` 或 `ios` 等其它平台。
4. 打开 `CloudV2Ray` 客户端，切换到`配置`页，将第二步得到的 `SecretKey` 和 `SecretId` 填入。
5. 配置好其它选项。推荐选择美国硅谷的可用区2。保存后会展示价格。可以切换不同地域，选择不同的实例规格，保存后查看价格并进行横向比对，选择最便宜的。
6. 切换到`概览`页，点击`创建实例`，待实例创建好后，点击`安装 V2Ray`。完成后界面提示 `V2Ray 代理连通，正在监听 socks5://127.0.0.1:7890`，则代表一切妥当。
7. 当结束使用时，可在`概览`页点击`销毁实例`。

需要注意的是，第 7 步的手动销毁实例结束云服务的计费，这个操作不是必须的。当 `CloudV2Ray` 客户端关闭后，10分钟后刚才创建的实例会自动销毁。原理是第6步在服务器上`安装 V2Ray` 时，会同时启动一个 HTTP 服务，`CloudV2Ray` 客户端每分钟会 Ping 一次这个服务。如果连续 10 分钟没有任何 `CloudV2Ray` 客户端通信，这个服务会调用腾讯云 API 销毁实例。

此外，第 6 步完成后，推荐在 Edge/Chrome 中使用 [SwitchyOmega](https://github.com/FelisCatus/SwitchyOmega) 扩展搭配[AutoProxy自动切换规则](https://github.com/aglent/autoproxy) 来按需代理。目前这里会有个循环依赖，没代理前无法安装插件，安装插件后才能代理；后续提供系统全局代理的能力后可解决该问题，在这之前请手动配置系统代理。

竞价实例可能被回收。如果发现科学网络中断了，可在`概览`页刷新下实例信息（会变回无实例），然后重新执行第 6 步。

## 截图

<p align='center'>
  <img src="https://github.com/YuhangGe/CloudV2Ray/blob/main/screenshots/a.png?raw=true" alt='Overview'>
</p>

<p align='center'>
  <img src="https://github.com/YuhangGe/CloudV2Ray/blob/main/screenshots/b.png?raw=true" alt='Instance'>
</p>

<p align='center'>
  <img src="https://github.com/YuhangGe/CloudV2Ray/blob/main/screenshots/c.png?raw=true" alt='Settings'>
</p>

<p align='center'>
  <img src="https://github.com/YuhangGe/CloudV2Ray/blob/main/screenshots/d.png?raw=true" alt='Logs'>
</p>

## Todos

- 支持更新 v2ray-core。
- 支持安卓。
- 支持公网按流量计费外的其它方式；支持绑定独立购买的弹性 IP。
- 支持阿里云等其它云服务厂商。
- 支持一键自动获取最低价资源（扫描所有地域所有规格的价格）。
