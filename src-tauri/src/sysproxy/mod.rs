//! Get/Set system proxy. Supports Windows, macOS and linux (via gsettings).

use crate::util::emit_log;
use anyhow_tauri::{IntoTAResult, TAResult};
use tauri::AppHandle;

#[cfg(target_os = "macos")]
mod macos;
#[cfg(target_os = "windows")]
mod windows;

#[derive(Debug, Default, Clone, PartialEq, Eq)]
pub struct Sysproxy {
  pub enable: bool,
  pub host: String,
  pub port: u16,
  pub bypass: String,
}

fn is_sysproxy_enabled(h: AppHandle) -> anyhow::Result<bool> {
  #[cfg(not(target_os = "android"))]
  {
    let proxy = Sysproxy::get_system_proxy()?;
    emit_log(&h, "log::sys", &format!("{:?}", proxy));
    println!("{:?}", proxy);
    return Ok(proxy.enable);
  }
  #[cfg(target_os = "android")]
  {
    return Ok(false);
  }
}

fn set_system_proxy(port: u16, enabled: bool) -> anyhow::Result<()> {
  #[cfg(not(target_os = "android"))]
  {
    Sysproxy::set_socks5_system_proxy("127.0.0.1", port, enabled)
  }
  #[cfg(target_os = "android")]
  {
    return Ok(());
  }
}
#[tauri::command]
pub fn tauri_is_sysproxy_enabled(h: AppHandle) -> TAResult<bool> {
  is_sysproxy_enabled(h).into_ta_result()
}

#[tauri::command]
pub fn tauri_set_sysproxy(port: u16, enabled: bool) -> TAResult<()> {
  set_system_proxy(port, enabled).into_ta_result()
}
