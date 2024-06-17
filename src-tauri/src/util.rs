use anyhow_tauri::TAResult;
use tauri::{AppHandle, Manager, Runtime};
use uuid::Uuid;

#[cfg(desktop)]
use crate::v2ray::{stop_v2ray_server, V2RayProc};
#[cfg(desktop)]
use std::process;
#[cfg(desktop)]
use tauri::State;

#[tauri::command]
pub fn tauri_generate_uuid() -> TAResult<String> {
  let id = Uuid::new_v4();
  Ok(id.to_string())
}

#[cfg(desktop)]
#[tauri::command]
pub async fn tauri_exit_process(state: State<'_, V2RayProc>) -> TAResult<()> {
  stop_v2ray_server(state).await;
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

pub fn emit_log<R: Runtime>(h: &AppHandle<R>, log_type: &str, log_message: &str) {
  println!("{} ==> {}", log_type, log_message);
  let _ = h.emit(log_type, log_message);
}
