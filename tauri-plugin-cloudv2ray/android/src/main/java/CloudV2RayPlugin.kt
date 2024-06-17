package com.plugin.cloudv2ray

import android.app.Activity
import android.util.Log
import app.tauri.annotation.Command
import app.tauri.annotation.InvokeArg
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.JSObject
import app.tauri.plugin.Plugin
import app.tauri.plugin.Invoke
import android.content.Context
import java.io.BufferedReader

@InvokeArg
class PingArgs {
  var value: String? = null
}

@TauriPlugin
class CloudV2RayPlugin(private val activity: Activity): Plugin(activity) {

    @Command
    fun ping(invoke: Invoke) {
        val args = invoke.parseArgs(PingArgs::class.java)

        val ret = JSObject()
        ret.put("value", args.value ?: "ok")
        invoke.resolve(ret)
    }

    @Command
    fun test(invoke: Invoke) {
        val x = this.activity.assets.open("tauri.conf.json").bufferedReader().use {
            it.readText()
        }
        println(x);
        Log.i("xxx", "hello")
         val ret = JSObject()
        ret.put("value", "ok")
        invoke.resolve(ret)
    }
}
