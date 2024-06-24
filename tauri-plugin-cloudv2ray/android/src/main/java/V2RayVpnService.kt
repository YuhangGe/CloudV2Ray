package com.plugin.cloudv2ray

import android.R
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Intent
import android.content.pm.ServiceInfo
import android.net.VpnService
import android.os.Build
import android.os.ParcelFileDescriptor
import androidx.core.app.NotificationCompat
import java.io.BufferedReader
import java.io.File
import java.io.InputStreamReader
import kotlin.system.exitProcess


const val ACTION_CONNECT: String = "hev.sockstun.CONNECT"

const val ACTION_DISCONNECT: String = "hev.sockstun.DISCONNECT"

//external fun nativeStartService(config_path: String, fd: Int)

class V2RayVpnService : VpnService() {
//  private external fun TProxyStartService(config_path: String, fd: Int)
//  private external fun TProxyStopService()
//  private external fun TProxyGetStats(): LongArray?
//
//  private external fun startV2Ray(vpnFd: Int)
//
//  init {
//    System.loadLibrary("cloudv2ray_lib")
//  }
//  private val tun: Tun2proxy = Tun2proxy()

  private val tunService = TProxyService()
  private var vpnInterface: ParcelFileDescriptor? = null
  private var v2rayCoreProcess: Process? = null

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

  private fun startV2RayCore(): Boolean {


    try {
      if (v2rayCoreProcess != null) {
        v2rayCoreProcess!!.destroy()
      }

    } catch (e: Exception) {
      println("failed destroy previous v2ray core: ${e.message}")
      return false
    }

    val v2rayCfg = File(filesDir, "v2ray.conf")
    if (!v2rayCfg.exists()) {
      println("v2ray.conf not found")
      return false
    }

    val cmd = arrayListOf(applicationInfo.nativeLibraryDir + File.separator + "libv2ray.so", "run", "-c", v2rayCfg.absolutePath, "-format", "json")
    println("exec ${cmd.joinToString()}");

    try {

      val pb = ProcessBuilder(cmd)
      val env = pb.environment()
      env.put("v2ray.location.asset", filesDir.absolutePath)
      pb.redirectErrorStream(true)

      v2rayCoreProcess = pb.directory(filesDir).start()

      Thread(Runnable {
        try {
          val br = BufferedReader(InputStreamReader(v2rayCoreProcess!!.inputStream))
          var line = br.readLine();
          while(line != null) {
            println(line)
            line = br.readLine()
          }
        } catch (e: Exception) {
          println("v2ray core: error readLine: ${e.message}")
        }
        println("v2ray-core process end")

      }).start()
      return true
    } catch(e: Exception) {
      println("error !!! ${e.message}")
      return false
    }
  }


  private fun connect() {
    if (vpnInterface != null) {
      vpnInterface!!.close()
    }

//    vpnInterface = createVpnInterface()
//    if (vpnInterface == null) {
//      println("failed to create vpn interface")
//      stopSelf()
//      return
//    }

    if (!(startV2RayCore())) {
      println("failed to start v2ray core")
      stopSelf()
      return
    }

    val tun2socksConf = File(filesDir, "tun2socks.conf")
    if (!tun2socksConf.exists()) {
      println("tun2socks.conf not found")
      stopSelf()
      return
    }
//    Thread(Runnable {
//      tunService.TProxyStartService(tun2socksConf.absolutePath, vpnInterface!!.fd)
//      println("tun proxy end")
//    }).start()

    val channelName = "CloudV2Ray"
    initNotificationChannel(channelName)
    createNotification(channelName)
  }

  private fun disconnect() {
    println("V2RayVpnService will disconnect")
    try {
      if (vpnInterface != null) {
        vpnInterface!!.close()
      }
    } catch (e: Exception) {
      // ignore
    }
    try {
      if (v2rayCoreProcess != null) {
        v2rayCoreProcess!!.destroy()
      }
    } catch (e: Exception) {
      // ignore
    }
    try {
      tunService.TProxyStopService()
    } catch (e: Exception) {
      // ignore
    }
    v2rayCoreProcess = null
    vpnInterface = null
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

  private fun createNotification(channelName: String) {
    val i = Intent(this, V2RayVpnService::class.java)
    val pi = PendingIntent.getService(this, 0, i, PendingIntent.FLAG_IMMUTABLE)
    val notification = NotificationCompat.Builder(this, channelName)
    val notify = notification
      .setContentTitle("CloudV2Ray")
      .setSmallIcon(R.drawable.sym_def_app_icon)
      .setContentIntent(pi)
      .build()
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
      println("start foreground PPPPPP")
      startForeground(1, notify)
    } else {
      println("start foreground PPPPPP2")
      startForeground(1, notify, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE)
    }
  }

  // create NotificationChannel
  private fun initNotificationChannel(channelName: String) {
    val notificationManager = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val channel = NotificationChannel(channelName, "CloudV2Ray", NotificationManager.IMPORTANCE_DEFAULT)
      notificationManager.createNotificationChannel(channel)
    }
  }
}