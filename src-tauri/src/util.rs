use anyhow_tauri::TAResult;
use uuid::Uuid;

#[tauri::command]
pub fn tauri_generate_uuid() -> TAResult<String> {
  let id = Uuid::new_v4();
  Ok(id.to_string())
}
