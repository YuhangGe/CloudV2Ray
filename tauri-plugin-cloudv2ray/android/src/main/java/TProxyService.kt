package com.plugin.cloudv2ray

class TProxyService {
    external fun TProxyStartService(config_path: String, fd: Int)
    external fun TProxyStopService()
    external fun TProxyGetStats(): LongArray?


    init {
        System.loadLibrary("hev-socks5-tunnel");
    }

}