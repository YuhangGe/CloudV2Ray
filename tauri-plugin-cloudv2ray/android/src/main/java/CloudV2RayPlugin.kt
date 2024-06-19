package com.plugin.cloudv2ray

import android.app.Activity
import android.app.Activity.RESULT_OK
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.VpnService
import android.os.Bundle
import android.webkit.WebView
import androidx.activity.result.ActivityResult
import androidx.activity.result.contract.ActivityResultContract
import app.tauri.annotation.ActivityCallback
import app.tauri.annotation.Command
import app.tauri.annotation.InvokeArg
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Invoke
import app.tauri.plugin.JSObject
import app.tauri.plugin.Plugin
import java.io.*
import java.util.zip.ZipFile

class MyReceiver(private val plugin: Plugin) : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        //toast "Broadcast received"
        val type = intent.type;
        if (type == "vpn") {
            val fd =  intent.getIntExtra("fd", 0);
            if (fd > 0) {
                plugin.trigger("vpn-start", JSObject().also { it.put("vpnFd", fd) })
            } else {
                plugin.trigger("vpn-stop", JSObject())
            }
        } else if (type == "log") {
            val msg = intent.getStringExtra("message")
            plugin.trigger("log", JSObject().also { it.put("message", msg) })
        }
    }
}

@TauriPlugin
class CloudV2RayPlugin(private val activity: Activity): Plugin(activity) {


//    private val recevier = MyReceiver(this)
    override fun load(webView: WebView) {
        super.load(webView)
//        activity.registerReceiver(recevier, IntentFilter("plugin.cloudv2ray"))
    }

    @ActivityCallback
    fun xxx(invoke: Invoke, result: ActivityResult) {
        println("xxx result ${result.data}")
    }
    @Command
    fun startVpn(invoke: Invoke) {
        val it = VpnService.prepare(activity);
        if (it != null) {
            this.startActivityForResult(invoke, it, "xxx")
        } else {
            startVpn()
        }
        invoke.resolve(JSObject())
    }

    private fun startVpn() {

        activity.startService(Intent(activity, V2RayVpnService::class.java))
    }

    @Command
    fun stopVpn(invoke: Invoke) {
//        vpnService.stopService()
        activity.stopService(Intent(activity, V2RayVpnService::class.java))

//        activity.startService(Intent(activity, V2RayVpnService::class.java)).also { it.action =  }
        invoke.resolve(JSObject())
    }
}
