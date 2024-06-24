// mod tun;

mod util;
#[cfg(desktop)]
mod v2ray;

// use std::ffi::CString;

// use jni::{objects::JClass, JNIEnv};
// use log::{Level, Metadata, Record};
use tauri::{
  plugin::{Builder, TauriPlugin},
  Manager, Runtime,
};

pub use util::emit_log;
#[cfg(desktop)]
use v2ray::*;

#[cfg(mobile)]
const PLUGIN_IDENTIFIER: &str = "com.plugin.cloudv2ray";

// struct ConsoleLogger;

// impl log::Log for ConsoleLogger {
//   fn enabled(&self, metadata: &Metadata) -> bool {
//     metadata.level() <= Level::Info
//       || metadata.level() <= Level::Trace && metadata.target() == "tun2proxy"
//   }

//   fn log(&self, record: &Record) {
//     if self.enabled(record.metadata()) {
//       println!("{} - {}", record.level(), record.args());
//     }
//   }

//   fn flush(&self) {}
// }

// static CONSOLE_LOGGER: ConsoleLogger = ConsoleLogger;

/// Initializes the plugin.
pub fn init<R: Runtime>() -> TauriPlugin<R> {
  // log::set_logger(&CONSOLE_LOGGER).unwrap();
  // log::set_max_level(log::LevelFilter::Trace);

  Builder::<R>::new("cloudv2ray")
    .invoke_handler(tauri::generate_handler![
      #[cfg(desktop)]
      tauri_start_v2ray_server,
      #[cfg(desktop)]
      tauri_stop_v2ray_server,
    ])
    .setup(|_app, _api| {
      #[cfg(desktop)]
      _app.manage(V2RayProc::new());
      #[cfg(mobile)]
      _api.register_android_plugin(PLUGIN_IDENTIFIER, "CloudV2RayPlugin")?;
      Ok(())
    })
    .build()
}

// #[no_mangle]
// pub unsafe extern "C" fn Java_com_plugin_cloudv2ray_V2RayVpnService_startV2Ray(
//   env: JNIEnv,
//   _: JClass,
//   vpn_fd: jni::sys::jint,
// ) {
// }
