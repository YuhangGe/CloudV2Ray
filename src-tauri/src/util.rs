use anyhow_tauri::TAResult;
use tauri::{AppHandle, Manager, Runtime};
use uuid::Uuid;

pub use tauri_plugin_cloudv2ray::emit_log;

#[cfg(desktop)]
use std::process;

#[tauri::command]
pub fn tauri_generate_uuid() -> TAResult<String> {
  let id = Uuid::new_v4();
  Ok(id.to_string())
}

#[cfg(desktop)]
#[tauri::command]
pub async fn tauri_exit_process() -> TAResult<()> {
  process::exit(0);
}

#[cfg(desktop)]
#[tauri::command]
pub fn tauri_open_devtools<R: Runtime>(h: AppHandle<R>) -> TAResult<()> {
  println!("open dev tools");
  if let Some(win) = h.get_webview_window("main") {
    win.open_devtools();
  }
  Ok(())
}
