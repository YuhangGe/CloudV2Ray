use anyhow_tauri::TAResult;

#[tauri::command]
pub async fn tauri_test() -> TAResult<String> {
  Ok("".into())
}
