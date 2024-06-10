use anyhow_tauri::{IntoTAResult, TAResult};
use tauri::AppHandle;

async fn test() -> anyhow::Result<String> {
  // Sysproxy::set_socks5_system_proxy("127.0.0.1", 7890, true)?;
  Ok("".into())
}
#[tauri::command]
pub async fn tauri_test(_handle: AppHandle) -> TAResult<String> {
  test().await.into_ta_result()
}
