// mod tun;

mod util;
#[cfg(desktop)]
mod v2ray;

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
  // android_logger::init_once(
  //   android_logger::Config::default().with_max_level(log::LevelFilter::Trace),
  // );

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
      // #[cfg(mobile)]
      // _api.register_android_plugin(PLUGIN_IDENTIFIER, "CloudV2RayPlugin")?;
      Ok(())
    })
    .build()
}

// #[no_mangle]
// pub unsafe extern "system" fn Java_com_plugin_cloudv2ray_V2RayVpnService_startTun<'a>(
//   env: JNIEnv<'a>,
//   _: JClass<'a>,
//   vpn_fd: jni::sys::jint,
// ) -> JString<'a> {
//   // let output = env
//   //   .new_string(format!("Hello, {}!", vpn_fd))
//   //   .expect("Couldn't create java string!");
//   // log::info!("rust jni called");
//   // output
//   let args = Args {
//     tun: None,
//     tun_fd: Some(vpn_fd as i32),

//     proxy: ArgProxy::try_from("socks5://127.0.0.1:7890").unwrap(),
//     ipv6_enabled: false,
//     setup: false,
//     dns: tun2proxy::ArgDns::Direct,
//     dns_addr: IpAddr::from_str("8.8.8.8").unwrap(),
//     bypass: vec![],
//     tcp_timeout: 600,
//     udp_timeout: 10,
//     verbosity: tun2proxy::ArgVerbosity::Debug,
//   };
//   // println!("rust will mobile run");
//   let res = tun2proxy::mobile_run(args, 8500, false);
//   log::error!("rust mobile run: {}", res);

//   env.new_string("ok").unwrap()
// }

// #[no_mangle]
// pub unsafe extern "system" fn Java_com_plugin_cloudv2ray_V2RayVpnService_stopTun<'a>(
//   _: JNIEnv<'a>,
//   _: JClass<'a>,
// ) {
//   tun2proxy::mobile_stop();
// }
