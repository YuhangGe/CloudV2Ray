use tauri::{AppHandle, Manager, Runtime};

pub fn emit_log<R: Runtime>(h: &AppHandle<R>, log_type: &str, log_message: &str) {
  println!("{} ==> {}", log_type, log_message);
  let _ = h.emit(log_type, log_message);
}
