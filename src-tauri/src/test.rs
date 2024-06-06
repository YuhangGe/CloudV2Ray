use std::io::Cursor;

use anyhow::Ok;
use anyhow_tauri::{IntoTAResult, TAResult};
use tauri::{AppHandle, Manager};
use tokio::{
  io::{self, AsyncBufReadExt, AsyncReadExt},
  net::unix::pipe,
};

async fn test(handle: AppHandle) -> anyhow::Result<String> {
  let resource_path = handle.path().resource_dir()?;
  println!("{:?}", resource_path);
  let zip_file: &str = if cfg!(all(target_arch = "x86_64", target_os = "windows")) {
    "resources/v2ray-x86_64-pc-windows-msvc.zip"
  } else if cfg!(all(target_arch = "aarch64", target_os = "macos")) {
    "resources/v2ray-aarch64-apple-darwin.zip"
  } else {
    ""
  };
  let zip_file_path = resource_path.join(zip_file);
  println!("{:?}", zip_file_path);
  let buf = std::fs::read(&zip_file_path)?;
  println!("buf: {:?}", buf.len());
  let target_dir = resource_path.join("v2ray");
  if target_dir.exists() {
    std::fs::remove_dir_all(&target_dir)?;
  }
  std::fs::create_dir(&target_dir)?;
  println!("begin extract");
  zip_extract::extract(Cursor::new(buf), &target_dir, true)?;
  println!("extract done");

  // let shell = handle.shell();
  // let cmd = shell.command("pwd"); //.current_dir(&target_dir);
  // let output = cmd.output().await?;
  // // let (rec, x) = cmd.spawn()?;

  // if output.status.success() {
  //   println!("Result: {:?}", String::from_utf8(output.stdout));
  // } else {
  //   println!("Exit with code: {}", output.status.code().unwrap());
  // }

  Ok("yeap!".into())
}

async fn test2(handle: AppHandle) -> anyhow::Result<String> {
  let resource_path = handle.path().resource_dir()?;
  let v2ray_path = resource_path.join("v2ray");
  println!("{:?}", resource_path);
  let v2ray_bin = v2ray_path.join(if cfg!(target_os = "windows") {
    "v2ray.exe"
  } else {
    "v2ray"
  });
  let mut command = tokio::process::Command::new(v2ray_bin);
  command.stdout(std::process::Stdio::piped());

  command.current_dir(v2ray_path);

  let mut proc = command.spawn()?;
  let pid = proc.id().unwrap();
  println!("pid: {}", pid);
  let stdo = proc.stdout.as_mut().unwrap();
  // let mut buffer = Vec::<u8>::with_capacity(10);
  let reader = tokio::io::BufReader::new(stdo);
  let mut lines_reader = reader.lines();
  while let Some(l) = lines_reader.next_line().await? {
    println!("Got: {}", l);
    handle.emit("v2ray::log", l)?;
  }

  Ok(format!("{{ pid: {} }}", pid))

  // use tauri_plugin_shell::ShellExt;
  // let shell = handle.shell();

  // let output = shell
  //   .command("echo")
  //   .args(["Hello from Rust!"])
  //   .output()
  //   .await
  //   .unwrap();
  // if output.status.success() {
  //   println!("Result: {:?}", String::from_utf8(output.stdout));
  // } else {
  //   println!("Exit with code: {}", output.status.code().unwrap());
  // }
  // println!("{:?}", v2ray_bin);

  // let command = handle.shell().command("pwd").current_dir(v2ray_path);

  // let oo = command.output().await?;
  // println!("{}", String::from_utf8(oo.stdout).unwrap());
  // let (mut rx, proc) = command.spawn()?;
  // println!("pid: {}", proc.pid());
  // while let Some(event) = rx.recv().await {
  //   match event {
  //     CommandEvent::Terminated(_) => break,
  //     CommandEvent::Stdout(x) => {
  //       let msg = String::from_utf8(x)?;
  //       println!("{}", msg);
  //     }
  //     _ => (),
  //   }
  // }
  // Ok("yy".into())
}

#[tauri::command]
pub async fn tauri_test(handle: AppHandle) -> TAResult<String> {
  let x = test(handle).await;
  println!("{:?}", x);
  x.into_ta_result()
  // .into_ta_result();
}

#[tauri::command]
pub async fn tauri_start_v2ray(handle: AppHandle) -> TAResult<String> {
  let x = test2(handle).await;
  println!("{:?}", x);
  x.into_ta_result()
  // .into_ta_result();
}
