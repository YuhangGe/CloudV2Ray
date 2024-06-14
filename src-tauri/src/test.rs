use anyhow_tauri::{IntoTAResult, TAResult};
use tauri::{AppHandle, Manager};

use crate::util::emit_log;

async fn test(h: &AppHandle) -> anyhow::Result<String> {
  let resource_path = h.path().resource_dir()?;
  emit_log(&h, "log::v2ray", &format!("{:?}", resource_path));
  let x = resource_path.join("t.txt");
  println!("exists: {}", x.exists());
  // let v2ray_bin_dir = resource_path.join("v2ray");
  // if v2ray_bin_dir.exists() {
  //   emit_log(
  //     h,
  //     "log::sys",
  //     "V2Ray 目录已存在，跳过首次启动解压缩 V2Ray 压缩包",
  //   );
  //   return Ok(());
  //   // std::fs::remove_dir_all(&v2ray_bin_dir)?;
  // }
  // emit_log(h, "log::sys", "首次启动，开始解压缩 V2Ray 压缩包...");
  // let zip_file: &str = get_platform_zip_file();
  // let zip_file_path = resource_path.join(zip_file);
  // // println!("{:?}", zip_file_path);
  // let buf = std::fs::read(&zip_file_path)?;
  // // println!("buf: {:?}", buf.len());

  // std::fs::create_dir(&v2ray_bin_dir)?;
  // // println!("begin extract");
  // zip_extract::extract(Cursor::new(buf), &v2ray_bin_dir, true)?;
  // // println!("extract done");
  // emit_log(h, "log::sys", "V2Ray 压缩包解压完成");
  // Ok(())
  // Sysproxy::set_socks5_system_proxy("127.0.0.1", 7890, true)?;
  Ok("".into())
}
#[tauri::command]
pub async fn tauri_test(h: AppHandle) -> TAResult<String> {
  test(&h).await.into_ta_result()
}
