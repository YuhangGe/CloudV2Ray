package com.plugin.cloudv2ray

import android.app.Activity
import android.app.Activity.RESULT_OK
import android.content.Context
import android.content.Intent
import android.net.VpnService
import android.os.Bundle
import androidx.activity.result.contract.ActivityResultContract
import app.tauri.annotation.Command
import app.tauri.annotation.InvokeArg
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Invoke
import app.tauri.plugin.JSObject
import app.tauri.plugin.Plugin
import java.io.*
import java.util.zip.ZipFile

object RustLib {
    init {
        System.loadLibrary("cloudv2ray_lib") // 加载库，根据平台调整名称
    }

    external fun hello()
}

/**
 * https://stackoverflow.com/questions/31329233/how-can-i-run-executable-in-assets
 */
object UnzipUtils {
    @Throws(IOException::class)
    fun unzip(zipFilePath: File, destDirectory: String) {
        ZipFile(zipFilePath).use { zip ->
            zip.entries().asSequence().forEach { entry ->
                zip.getInputStream(entry).use { input ->
                    val dst = File(destDirectory, entry.name)
                    if (!entry.isDirectory) {
                        // if the entry is a file, extracts it
                        extractFile(input, dst)
                    } else {
                        // if the entry is a directory, make the directory
                        dst.mkdir()
                    }
                }
            }
        }
    }
    @Throws(IOException::class)
    private fun extractFile(inputStream: InputStream, destFile: File) {
        val bos = BufferedOutputStream(FileOutputStream(destFile))
        val bytesIn = ByteArray(BUFFER_SIZE)
        var read: Int
        while (inputStream.read(bytesIn).also { read = it } != -1) {
            bos.write(bytesIn, 0, read)
        }
        bos.close()
    }
    private const val BUFFER_SIZE = 4096
}

@InvokeArg
class RunV2RayArgs {
    var config: String? = null
}

@TauriPlugin
class CloudV2RayPlugin(private val activity: Activity): Plugin(activity) {

//
//
//    @Command
//    fun ping(invoke: Invoke) {
//        val args = invoke.parseArgs(PingArgs::class.java)
//
//        val ret = JSObject()
//        ret.put("value", args.value ?: "ok")
//        invoke.resolve(ret)
//    }

 
    private lateinit var proc: Process

    private fun unzipV2ray() {
        val src = activity.assets.open("v2ray.zip")
        val dst = File(activity.filesDir, "v2ray.zip")
        src.copyTo(FileOutputStream(dst))
        UnzipUtils.unzip(dst, activity.filesDir.absolutePath)
        dst.delete();
        println("v2ray unzipped")
    }



    @Command
    fun startV2RayCore(invoke: Invoke) {

        val args = invoke.parseArgs(RunV2RayArgs::class.java)
        if (args.config.isNullOrEmpty()) {
            invoke.reject("missing config")
            return
        }

        val v2rayCfg = File(activity.filesDir, "config.json")
        if (!v2rayCfg.exists()) {
            unzipV2ray()
        } else {
            println("skip v2ray unzip")
        }

        v2rayCfg.writeText(args.config ?: "")
//        println(args.config)


        val cmd = arrayListOf(activity.applicationInfo.nativeLibraryDir + File.separator + "libv2ray.so", "run", "-c", v2rayCfg.absolutePath)
        println("exec ${cmd.joinToString()}");

        try {
            proc.destroy()
        } catch (e: Exception) {
            println("failed destroy previous v2ray core: ${e.message}")
        }
        try {

            val pb = ProcessBuilder(cmd)
            pb.redirectErrorStream(true)
            proc = pb.directory(activity.filesDir).start()

            Thread(Runnable {
                try {
                    val br = BufferedReader(InputStreamReader(proc.inputStream))
                    var line = br.readLine();
                    while(line != null) {
                        println(line)
                        line = br.readLine()
                    }
                } catch (e: Exception) {
                    println("v2ray core: error readLine: ${e.message}")
                }
                println("process end")
            }).start()

        } catch(e: Exception) {
            println("error !!! ${e.message}")
        }

        invoke.resolve(JSObject())
    }

    @Command
    fun stopV2RayCore(invoke: Invoke) {
        try {
            proc.destroy()
        } catch (e: Exception) {
            println("failed destroy previous v2ray core: ${e.message}")
        }
        invoke.resolve(JSObject())
    }


    @Command
    fun startVpn(invoke: Invoke) {
//        RustLib.hello()
//
        val it = VpnService.prepare(activity);
        var fd: Int = 0
        if (it != null) {
            activity.startActivityForResult(it, 0x0f)
            println("OOOOOOOOO $it")
        } else {
            startVpn()
        }
        trigger("vpn-started", JSObject())
        invoke.resolve(JSObject())
    }

    private fun startVpn() {
        activity.startService(Intent(activity, V2RayVpnService::class.java, ))
    }

    @Command
    fun stopVpn(invoke: Invoke) {
//        vpnService.stopService()
        activity.stopService(Intent(activity, V2RayVpnService::class.java))

//        activity.startService(Intent(activity, V2RayVpnService::class.java)).also { it.action =  }
        invoke.resolve(JSObject())
    }
}
