use anyhow::Ok;
use anyhow_tauri::{IntoTAResult, TAResult};
use tauri::http::HeaderMap;

async fn ping(url: &str, token: &str) -> anyhow::Result<String> {
  let client = reqwest::Client::new();
  let mut map = HeaderMap::new();
  map.insert("x-token", token.parse().unwrap());
  let res = client.post(url).headers(map).send().await?;
  let text = res.text().await?;
  Ok(text)
}

#[tauri::command]
pub async fn tauri_ping_v2ray_agent(url: &str, token: &str) -> TAResult<String> {
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
  ping(url, token).await.into_ta_result()
}
