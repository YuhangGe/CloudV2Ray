mod tun;

mod util;
mod v2ray;

use log::{Level, Metadata, Record};
use tauri::{
  plugin::{Builder, TauriPlugin},
  Manager, Runtime,
};

pub use util::emit_log;
use v2ray::*;

use tun::*;

#[cfg(mobile)]
const PLUGIN_IDENTIFIER: &str = "com.plugin.cloudv2ray";

struct ConsoleLogger;

impl log::Log for ConsoleLogger {
  fn enabled(&self, metadata: &Metadata) -> bool {
    metadata.level() <= Level::Info
      || metadata.level() <= Level::Trace && metadata.target() == "tun2proxy"
  }

  fn log(&self, record: &Record) {
    if self.enabled(record.metadata()) {
      println!("{} - {}", record.level(), record.args());
    }
  }

  fn flush(&self) {}
}

static CONSOLE_LOGGER: ConsoleLogger = ConsoleLogger;

/// Initializes the plugin.
pub fn init<R: Runtime>() -> TauriPlugin<R> {
  log::set_logger(&CONSOLE_LOGGER).unwrap();
  log::set_max_level(log::LevelFilter::Trace);

  Builder::<R>::new("cloudv2ray")
    .invoke_handler(tauri::generate_handler![
      tauri_start_v2ray_server,
      tauri_stop_v2ray_server,
      #[cfg(mobile)]
      tauri_start_tun2socks_server,
      #[cfg(mobile)]
      tauri_stop_tun2socks_server
    ])
    .setup(|_app, _api| {
      _app.manage(V2RayProc::new());
      _app.manage(Tun2SocksProc::new());
      #[cfg(mobile)]
      _api.register_android_plugin(PLUGIN_IDENTIFIER, "CloudV2RayPlugin")?;
      Ok(())
    })
    .build()
}
