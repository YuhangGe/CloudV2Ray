package com.plugin.cloudv2ray

import android.content.Intent
import android.net.VpnService
import android.os.Build
import android.os.ParcelFileDescriptor
import java.io.File
import kotlin.system.exitProcess

const val ACTION_CONNECT: String = "hev.sockstun.CONNECT"

const val ACTION_DISCONNECT: String = "hev.sockstun.DISCONNECT"

class V2RayVpnService : VpnService() {
  private external fun TProxyStartService(config_path: String, fd: Int)
  private external fun TProxyStopService()
  private external fun TProxyGetStats(): LongArray?



  init {
    System.loadLibrary("hev-socks5-tunnel");
  }

  private var vpnInterface: ParcelFileDescriptor? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    if (intent != null && ACTION_DISCONNECT.equals(intent.getAction())) {
      disconnect();
      return START_NOT_STICKY;
    }
    return START_STICKY
  }


  override fun onDestroy() {
    super.onDestroy()
    disconnect()
  }

  override fun onRevoke() {
    disconnect()
    super.onRevoke()
  }


  private fun connect() {
    vpnInterface = createVpnInterface()
    if (vpnInterface == null) {
      println("failed to create vpn interface")
      stopSelf()
      return
    }

    val conf = File(this.filesDir, "tun2socks.conf").absolutePath
    TProxyStartService(conf, vpnInterface!!.fd)
  }

  private fun disconnect() {
    if (vpnInterface == null) return
    TProxyStopService()
    try {
      vpnInterface!!.close()
    } catch (e: Exception) {
      // ignore
    }
    vpnInterface = null;
    exitProcess(0)
  }


  private fun createVpnInterface(): ParcelFileDescriptor? {
    return Builder()
      .addAddress("10.0.0.2", 32)
      .addRoute("0.0.0.0", 0)
      // .addDnsServer("8.8.8.8")
      .setMtu(8500)
      .setSession("VPN-V2Ray/Global")
//      .setBlocking(true)
//      .setConfigureIntent(mConfigureIntent)
      .also {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
          it.setMetered(false)
        }
      }
      .establish()
  }

}