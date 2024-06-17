use tauri::{
  plugin::{Builder, TauriPlugin},
  Runtime,
};

#[cfg(mobile)]
const PLUGIN_IDENTIFIER: &str = "com.plugin.cloudv2ray";

/// Initializes the plugin.
pub fn init<R: Runtime>() -> TauriPlugin<R> {
  Builder::<R>::new("cloudv2ray")
    .setup(|_app, _api| {
      #[cfg(mobile)]
      _api.register_android_plugin(PLUGIN_IDENTIFIER, "CloudV2RayPlugin")?;
      Ok(())
    })
    .build()
}
