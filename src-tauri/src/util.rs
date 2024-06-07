use anyhow_tauri::TAResult;
use tauri::{AppHandle, Manager};
use uuid::Uuid;

#[tauri::command]
pub fn tauri_generate_uuid() -> TAResult<String> {
  let id = Uuid::new_v4();
  Ok(id.to_string())
}

pub const fn get_platform_zip_file() -> &'static str {
  if cfg!(target_os = "windows") {
    if cfg!(target_arch = "x86_64") {
      "resources/v2ray-windows-x64.zip"
    } else {
      ""
    }
  } else if cfg!(target_os = "macos") {
    if cfg!(target_arch = "aarch64") {
      "resources/v2ray-macos-arm64.zip"
    } else {
      "resources/v2ray-macos-x64.zip"
    }
  } else if cfg!(target_os = "android") {
    if cfg!(target_arch = "arm") {
      "resources/v2ray-android-arm64.zip"
    } else {
      ""
    }
  } else {
    ""
  }
}

pub fn emit_log(h: &AppHandle, log_type: &str, log_message: &str) {
  println!("{} ==> {}", log_type, log_message);
  let _ = h.emit(log_type, log_message);
}
