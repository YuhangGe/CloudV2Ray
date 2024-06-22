package com.plugin.cloudv2ray

import android.content.Intent
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import android.net.VpnService
import android.os.Build
import android.os.ParcelFileDescriptor
import java.io.File
import kotlin.system.exitProcess

const val ACTION_CONNECT: String = "hev.sockstun.CONNECT"

const val ACTION_DISCONNECT: String = "hev.sockstun.DISCONNECT"

//external fun nativeStartService(config_path: String, fd: Int)

class V2RayVpnService : VpnService() {
//  private external fun TProxyStartService(config_path: String, fd: Int)
//  private external fun TProxyStopService()
//  private external fun TProxyGetStats(): LongArray?
//


//  init {
//    System.loadLibrary("hev-socks5-tunnel");
//  }

//  private val tun: Tun2proxy = Tun2proxy()

  private var vpnInterface: ParcelFileDescriptor? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    println("on s cmd ${intent?.action}")
    if (intent != null && ACTION_DISCONNECT == intent.action) {
      disconnect();
      return START_NOT_STICKY;
    }
    connect()
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
    sendBroadcast(Intent("cloudv2ray").also {
      it.putExtra("type", "vpn")
      it.putExtra("fd", vpnInterface!!.fd)
    })
//    println(File(this.filesDir, "tun2socks.conf").readText())
//    val conf = File(this.filesDir, "tun2socks.conf").absolutePath
//    TProxyStartService(conf, vpnInterface!!.fd)
//    println("will start tun2socks")
//    Thread(Runnable {
//      TProxyStartService(conf, vpnInterface!!.fd)
//      println("tun2socks !!!!!")
//    }).start()
//    tun.run("SOCKS5://127.0.0.1:7890", vpnInterface!!.fd,
//      false,
//      8500,
//      2,
//      3)
//    println("tun2socks !!!!!")

  }

  private fun disconnect() {
    println("will disconnect tun2socks")
    if (vpnInterface == null) return
//    TProxyStopService()
//    tun.stop()
    try {
      vpnInterface!!.close()
    } catch (e: Exception) {
      // ignore
    }
    vpnInterface = null;
    exitProcess(0)
  }

//  private fun fixnetwork() {
//    val builder = NetworkRequest.Builder()
//    builder.addTransportType(NetworkCapabilities.TRANSPORT_VPN)
//    val request = builder.build()
//
//     connectivityManager.requestNetwork(request, object : NetworkCallback() {
//      override fun onAvailable(network: Network) {
//        super.onAvailable(network)
//        Log.i(TAG,"Binding to VPN Network!")
//        val bindResult = connectivityManager.bindProcessToNetwork(network)
//        Log.i(TAG,"Bind to VPN result = $bindResult")
//      }
//    })
//  }

  private fun createVpnInterface(): ParcelFileDescriptor? {
    return Builder()
      .addAddress("198.18.0.1", 32)
      .addRoute("0.0.0.0", 0)
      .addAddress("fc00::1", 128)
      .addRoute("::", 0)
      .addDnsServer( "2001:4860:4860::8888")
      .addDnsServer("8.8.8.8")
      .setMtu(8500)
      .setSession("VPN-V2Ray")
      .setBlocking(false)
//      .setBlocking(true)
//      .setConfigureIntent(mConfigureIntent)
//      .also {
//        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
//          it.setMetered(false)
//        }
//      }
      .establish()
  }

}