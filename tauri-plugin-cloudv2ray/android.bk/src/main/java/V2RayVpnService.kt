package com.plugin.cloudv2ray

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.net.ConnectivityManager
import android.net.LocalSocket
import android.net.LocalSocketAddress
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import android.net.VpnService
import android.os.Build
import android.os.ParcelFileDescriptor
import android.util.Log
import androidx.annotation.RequiresApi
import androidx.core.app.NotificationCompat
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.launch
import java.io.BufferedReader
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.io.IOException
import java.io.InputStreamReader
import java.nio.ByteBuffer
import java.nio.channels.FileChannel
import kotlin.system.exitProcess


const val ACTION_CONNECT: String = "hev.sockstun.CONNECT"

const val ACTION_DISCONNECT: String = "hev.sockstun.DISCONNECT"

//external fun nativeStartService(config_path: String, fd: Int)

class V2RayVpnService : VpnService() {
//  private external fun TProxyStartService(config_path: String, fd: Int)
//  private external fun TProxyStopService()
//  private external fun TProxyGetStats(): LongArray?
//
companion object {
  private const val VPN_MTU = 1500
  private const val PRIVATE_VLAN4_CLIENT = "26.26.26.1"
  private const val PRIVATE_VLAN4_ROUTER = "26.26.26.2"
  private const val PRIVATE_VLAN6_CLIENT = "da26:2626::1"
  private const val PRIVATE_VLAN6_ROUTER = "da26:2626::2"
  private const val TUN2SOCKS = "libtun2socks.so"
}

//  private external fun startTun(vpnFd: Int): String
//  private external fun stopTun()
////
//  init {
//    System.loadLibrary("cloudv2ray_lib")
//  }
//  private val tun: Tun2proxy = Tun2proxy()

  private var vpnInterface: ParcelFileDescriptor? = null
  private var v2rayCoreProcess: Process? = null
  private var tun2socksProcess : Process? = null

  /**destroy
   * Unfortunately registerDefaultNetworkCallback is going to return our VPN interface: https://android.googlesource.com/platform/frameworks/base/+/dda156ab0c5d66ad82bdcf76cda07cbc0a9c8a2e
   *
   * This makes doing a requestNetwork with REQUEST necessary so that we don't get ALL possible networks that
   * satisfies default network capabilities but only THE default network. Unfortunately we need to have
   * android.permission.CHANGE_NETWORK_STATE to be able to call requestNetwork.
   *
   * Source: https://android.googlesource.com/platform/frameworks/base/+/2df4c7d/services/core/java/com/android/server/ConnectivityService.java#887
   */
  @delegate:RequiresApi(Build.VERSION_CODES.P)
  private val defaultNetworkRequest by lazy {
    NetworkRequest.Builder()
      .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
      .addCapability(NetworkCapabilities.NET_CAPABILITY_NOT_RESTRICTED)
      .build()
  }

  private val connectivity by lazy { getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager }

  @delegate:RequiresApi(Build.VERSION_CODES.P)
  private val defaultNetworkCallback by lazy {
    object : ConnectivityManager.NetworkCallback() {
      override fun onAvailable(network: Network) {
        setUnderlyingNetworks(arrayOf(network))
      }

      override fun onCapabilitiesChanged(network: Network, networkCapabilities: NetworkCapabilities) {
        // it's a good idea to refresh capabilities
        setUnderlyingNetworks(arrayOf(network))
      }

      override fun onLost(network: Network) {
        setUnderlyingNetworks(null)
      }
    }
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    println("on s cmd ${intent?.action}")
    if (intent != null && ACTION_DISCONNECT == intent.action) {
      disconnect();
      return START_NOT_STICKY;
    }
    connect()
    return START_STICKY
  }


  override fun onCreate() {
    super.onCreate()
    println("ON CREATED");
    Thread(Runnable {
      do {
        Thread.sleep(3000)
        println("Service is live")
      } while (true)
    }).start()
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

  private fun runTun2socks() {

    if (tun2socksProcess != null) {
      try {
        tun2socksProcess!!.destroy()
      } catch (e: Exception) {
        // ignore
      }
    }
    val cmd = arrayListOf(File(applicationContext.applicationInfo.nativeLibraryDir, TUN2SOCKS).absolutePath,
      "--netif-ipaddr", PRIVATE_VLAN4_ROUTER,
      "--netif-netmask", "255.255.255.252",
      "--socks-server-addr", "127.0.0.1:7890",
      "--tunmtu", VPN_MTU.toString(),
      "--sock-path", "sock_path",//File(applicationContext.filesDir, "sock_path").absolutePath,
      "--enable-udprelay",
      "--loglevel", "debug")

//    if (settingsStorage?.decodeBool(AppConfig.PREF_PREFER_IPV6) == true) {
//      cmd.add("--netif-ip6addr")
//      cmd.add(PRIVATE_VLAN6_ROUTER)
//    }
//    if (settingsStorage?.decodeBool(AppConfig.PREF_LOCAL_DNS_ENABLED) == true) {
//      val localDnsPort = Utils.parseInt(settingsStorage?.decodeString(AppConfig.PREF_LOCAL_DNS_PORT), AppConfig.PORT_LOCAL_DNS.toInt())
//      cmd.add("--dnsgw")
//      cmd.add("127.0.0.1:${localDnsPort}")
//    }

    try {
      val proBuilder = ProcessBuilder(cmd)
      proBuilder.redirectErrorStream(true)
      tun2socksProcess = proBuilder
        .directory(applicationContext.filesDir)
        .start()
      println("tun2socks process started..")
      Thread(Runnable {
//        try {
//          val br = BufferedReader(InputStreamReader(tun2socksProcess!!.inputStream))
//          var line = br.readLine();
//          while(line != null) {
//            println(line)
//            line = br.readLine()
//          }
//        } catch (e: Exception) {
//          println("tun2socks: error readLine: ${e.message}")
//        }
        tun2socksProcess!!.waitFor()
        println("tun2socks process end")

      }).start()

      sendFd()
    } catch (e: Exception) {
      println("failed run tun2socks: ${e.message}")
    }
  }

  private fun sendFd() {
    val fd = vpnInterface!!.fileDescriptor
    val sp = File(applicationContext.filesDir, "sock_path")
    val path = sp.absolutePath

//    val vpnInput: FileChannel = FileInputStream(fd).channel
////    val vpnOutput: FileChannel = FileOutputStream(fd).channel
//
//    try {
//      var bufferToNetwork: ByteBuffer? = null
//      while (!Thread.interrupted()) {
//        bufferToNetwork = ByteBuffer.allocate(16384)
//        val readBytes = vpnInput.read(bufferToNetwork)
//
//        if (readBytes > 0) {
//          bufferToNetwork.flip()
//
//          val packet: Packet = Packet(bufferToNetwork)
//          if (packet.isUDP()) {
//            println("udp packet")
//          } else if (packet.isTCP()) {
//            println("tcp packet")
//
//          } else {
//            println("unknown packet")
//          }
//        } else {
//          try {
//            Thread.sleep(10)
//          } catch (e: InterruptedException) {
//            e.printStackTrace()
//          }
//        }
//      }
//    } catch (e: IOException) {
//      println(e.message)
//    } finally {
//      vpnInput.close()
//    }

    println("tun2socks send fd $path, ${sp.exists()}")
    GlobalScope.launch(Dispatchers.IO) {
      var tries = 0
      while (true) try {
        Thread.sleep(50L shl tries)
        println("sendFd tries: $tries")
        LocalSocket().use { localSocket ->
          localSocket.connect(LocalSocketAddress(path, LocalSocketAddress.Namespace.FILESYSTEM))
          localSocket.setFileDescriptorsForSend(arrayOf(fd))
          localSocket.outputStream.write(42)
        }
        break
      } catch (e: Exception) {
        println(e.toString())
        if (tries > 5) break
        tries += 1
      }
    }
  }


  private fun connect() {
    if (vpnInterface != null) {
      vpnInterface!!.close()
    }

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
      try {
        connectivity.requestNetwork(defaultNetworkRequest, defaultNetworkCallback)
      } catch (e: Exception) {
        e.printStackTrace()
      }
    }
    vpnInterface = createVpnInterface()
    if (vpnInterface == null) {
      println("failed to create vpn interface")
      stopSelf()
      return
    }

    if (!(startV2RayCore())) {
      println("failed to start v2ray core")
      stopSelf()
      return
    }

    runTun2socks()
//    val tun2socksConf = File(filesDir, "tun2socks.conf")
//    if (!tun2socksConf.exists()) {
//      println("tun2socks.conf not found")
//      stopSelf()
//      return
//    }
//    println(tun2socksConf.readText())
//    val x = tunService.TProxyStartService(tun2socksConf.absolutePath, vpnInterface!!.fd)
//    Thread(Runnable {
//      println("call startTun...")
//      val x = startTun(vpnInterface!!.fd)
//      println("tun2socks process end $x")
//    }).start()

//    println("tun2socks $x")
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
//      tunService.TProxyStopService()
//      stopTun()
      if (tun2socksProcess != null) {
        tun2socksProcess!!.destroy()
      }
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
      .addAddress(PRIVATE_VLAN4_CLIENT, 30)
      .addRoute("0.0.0.0", 0)
//      .addAddress("fc00::1", 128)
//      .addRoute("::", 0)
//      .addDnsServer( "2001:4860:4860::8888")
      .addDnsServer("1.1.1.1")
      .setMtu(VPN_MTU)
      .setSession("VPN-V2Ray")
      .setBlocking(false)
//      .setBlocking(true)
//      .setConfigureIntent(mConfigureIntent)
      .also {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
          it.setMetered(false)
        }
      }
      .establish()
  }

  private fun createNotification(channelName: String) {
    val i = Intent(this, V2RayVpnService::class.java)
    val pi = PendingIntent.getService(this, 0, i, PendingIntent.FLAG_IMMUTABLE)
    val notification = NotificationCompat.Builder(this, channelName)
    val notify = notification
      .setContentTitle("CloudV2Ray")
      .setSmallIcon(android.R.drawable.ic_media_play)
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