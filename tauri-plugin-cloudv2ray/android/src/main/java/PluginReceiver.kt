package com.plugin.cloudv2ray

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import app.tauri.plugin.JSObject
import app.tauri.plugin.Plugin

class PluginReceiver(private val plugin: Plugin) : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        //toast "Broadcast received"
        val type = intent.type;
        if (type == "vpn") {
            val fd =  intent.getIntExtra("fd", 0);
            if (fd > 0) {
                plugin.trigger("mobile::vpn-start", JSObject().also { it.put("vpnFd", fd) })
            } else {
                plugin.trigger("mobile::vpn-stop", JSObject())
            }
            println("RECEIVE vpn $fd")
        } else if (type == "log") {
            val msg = intent.getStringExtra("message")
            println("RECEIVE log $msg")
            plugin.trigger("mobile::log", JSObject().also { it.put("message", msg) })
        }
    }
}