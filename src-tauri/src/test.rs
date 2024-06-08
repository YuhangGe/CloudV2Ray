use anyhow_tauri::TAResult;
use tauri::AppHandle;

#[tauri::command]
pub async fn tauri_test(_handle: AppHandle) -> TAResult<String> {
  Ok("ok".into())
}
