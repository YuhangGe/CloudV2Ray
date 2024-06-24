package com.plugin.cloudv2ray

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import app.tauri.plugin.JSObject

class PluginReceiver(private val plugin: CloudV2RayPlugin) : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        println("onReceive ${intent.extras}")
        val type = intent.getStringExtra("type")
        if (type == "vpn") {
            val fd =  intent.getIntExtra("fd", 0);
            val activity = plugin.activity;
            plugin.trigger("mobile::vpn", JSObject().also {
//                it.put("filesDir", activity.filesDir.absolutePath)
//                it.put("libsDir", activity.applicationInfo.nativeLibraryDir)
                it.put("vpnFd", fd)
            })
            println("RECEIVE vpn $fd")
        } else if (type == "log") {
            val msg = intent.getStringExtra("message")
            println("RECEIVE log $msg")
            plugin.trigger("log", JSObject().also { it.put("message", msg) })
        }
    }
}