package com.plugin.cloudv2ray

import android.app.Activity
import android.app.Activity.RESULT_OK
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.VpnService
import android.os.Build
import android.os.Bundle
import android.webkit.WebView
import androidx.activity.result.ActivityResult
import androidx.activity.result.contract.ActivityResultContract
import androidx.localbroadcastmanager.content.LocalBroadcastManager
import app.tauri.annotation.ActivityCallback
import app.tauri.annotation.Command
import app.tauri.annotation.InvokeArg
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Invoke
import app.tauri.plugin.JSObject
import app.tauri.plugin.Plugin
import java.io.*
import java.util.zip.ZipFile

@InvokeArg
class StartVpnArg {
    lateinit var v2rayConf: String
    lateinit var tun2socksConf: String
}

@TauriPlugin
class CloudV2RayPlugin(val activity: Activity): Plugin(activity) {
    private val receiver: PluginReceiver = PluginReceiver(this)
    override fun load(webView: WebView) {
        super.load(webView)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            activity.registerReceiver(receiver, IntentFilter("cloudv2ray"), Context.RECEIVER_EXPORTED)
        }else {
            activity.registerReceiver(receiver, IntentFilter())
        }
        val geoip = File(activity.filesDir, "geoip.dat");
        if (!geoip.exists()) {
            activity.assets.open("geoip.dat").copyTo(FileOutputStream(geoip))
            activity.assets.open("geosite.dat")
                .copyTo(FileOutputStream(File(activity.filesDir, "geosite.dat")))
        }
    }

    @Command
    fun getMobileDir(invoke: Invoke) {
        invoke.resolve(JSObject().also {
            it.put("filesDir", activity.filesDir )
            it.put("libsDir", activity.applicationInfo.nativeLibraryDir)
        })
    }

    @ActivityCallback
    fun onActivityResult(invoke: Invoke, result: ActivityResult) {
        if (result.resultCode == RESULT_OK) {
            doStartVpn()
        }
    }
    @Command
    fun startVpn(invoke: Invoke) {
        val args = invoke.parseArgs(StartVpnArg::class.java)
        val v2rayConf = File(activity.filesDir, "v2ray.conf")
        v2rayConf.writeText(args.v2rayConf)
        val tun2socksConf = File(activity.filesDir, "tun2socks.conf")
        tun2socksConf.writeText(args.tun2socksConf)

        val it = VpnService.prepare(activity);
        if (it != null) {
            this.startActivityForResult(invoke, it, "onActivityResult")
        } else {
            doStartVpn()
        }
        invoke.resolve(JSObject())
    }

    private fun doStartVpn() {
//        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
//            activity.startForegroundService(Intent(activity, V2RayVpnService::class.java).also { it.setAction(ACTION_CONNECT) })
//        } else {
//            activity.startService(Intent(activity, V2RayVpnService::class.java).also { it.setAction(ACTION_CONNECT) })
//        }
        activity.startService(Intent(activity, V2RayVpnService::class.java).also { it.setAction(ACTION_CONNECT) })
    }

    @Command
    fun stopVpn(invoke: Invoke) {
        println("will stop vpn")
        activity.startService(Intent(activity, V2RayVpnService::class.java).also { it.setAction(ACTION_DISCONNECT) })
        invoke.resolve(JSObject())
    }


}
