use tauri::{
    plugin::{Builder, TauriPlugin},
    Manager, Runtime,
};

use std::{collections::HashMap, sync::Mutex};

pub use models::*;

#[cfg(desktop)]
mod desktop;
#[cfg(mobile)]
mod mobile;

mod commands;
mod error;
mod models;

pub use error::{Error, Result};

#[cfg(desktop)]
use desktop::Cloudv2ray;
#[cfg(mobile)]
use mobile::Cloudv2ray;

#[derive(Default)]
struct MyState(Mutex<HashMap<String, String>>);

/// Extensions to [`tauri::App`], [`tauri::AppHandle`] and [`tauri::Window`] to access the cloudv2ray APIs.
pub trait Cloudv2rayExt<R: Runtime> {
    fn cloudv2ray(&self) -> &Cloudv2ray<R>;
}

impl<R: Runtime, T: Manager<R>> crate::Cloudv2rayExt<R> for T {
    fn cloudv2ray(&self) -> &Cloudv2ray<R> {
        self.state::<Cloudv2ray<R>>().inner()
    }
}

/// Initializes the plugin.
pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("cloudv2ray")
        .invoke_handler(tauri::generate_handler![commands::execute])
        .setup(|app, api| {
            #[cfg(mobile)]
            let cloudv2ray = mobile::init(app, api)?;
            #[cfg(desktop)]
            let cloudv2ray = desktop::init(app, api)?;
            app.manage(cloudv2ray);

            // manage state so it is accessible by the commands
            app.manage(MyState::default());
            Ok(())
        })
        .build()
}
