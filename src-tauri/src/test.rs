use std::io::Cursor;

use anyhow::Ok;
use anyhow_tauri::{IntoTAResult, TAResult};
use tauri::{path::BaseDirectory, AppHandle, Manager};

async fn test(handle: AppHandle) -> anyhow::Result<String> {
  let resource_path = handle
    .path()
    .resolve("xxx", BaseDirectory::Resource)
    .unwrap();
  println!("{}", resource_path.to_str().unwrap());
  let mut xx = resource_path.read_dir().unwrap();
  let yy = xx.nth(0);
  println!("{:?}", yy);
  let zip_file: &str = if cfg!(all(target_arch = "x86_64", target_os = "windows")) {
    "v2ray-x86_64-pc-windows-msvc.zip"
  } else if cfg!(all(target_arch = "aarch64", target_os = "macos")) {
    "v2ray-aarch64-apple-darwin.zip"
  } else {
    ""
  };
  let zip_file_path = resource_path.join(&zip_file);
  println!("{:?}", zip_file_path);
  let buf = std::fs::read(zip_file_path)?;
  let target_dir = resource_path.join("v2ray");
  zip_extract::extract(Cursor::new(buf), &target_dir, true)?;
  Ok("yeap!".into())
}

#[tauri::command]
pub async fn tauri_test(handle: AppHandle) -> TAResult<String> {
  // use tauri_plugin_shell::ShellExt;
  // let dir = std::env::current_dir().unwrap();
  // println!("PWD: {:?}", dir);
  // let shell = app_handle.shell();
  // let output = shell.command("pwd").output().await.unwrap();
  // if output.status.success() {
  //   println!("Result: {:?}", String::from_utf8(output.stdout));
  // } else {
  //   println!("Exit with code: {}", output.status.code().unwrap());
  // }
  test(handle).await.into_ta_result()
}
