use tauri::{AppHandle, Manager, Runtime};

use std::{io::Cursor, sync::Arc};

use anyhow_tauri::{IntoTAResult, TAResult};
use tauri::State;
use tokio::{
  io::{AsyncBufReadExt, AsyncRead},
  process::Child,
  sync::Mutex,
};

use crate::util::emit_log;

pub struct V2RayProc(Arc<Mutex<Option<Child>>>);

impl V2RayProc {
  pub fn new() -> Self {
    Self(Arc::new(Mutex::new(None)))
  }
}

async fn read<R: Runtime, T: AsyncRead + Unpin>(stdo: T, h: &AppHandle<R>) {
  let reader = tokio::io::BufReader::new(stdo);
  let mut lines_reader = reader.lines();
  loop {
    match lines_reader.next_line().await {
      Ok(line) => {
        if let Some(l) = line {
          emit_log(h, "log::v2ray", &l);
        } else {
          break;
        }
      }
      Err(e) => {
        eprintln!("{}", e);
        break;
      }
    }
  }
}

pub async fn stop_v2ray_server(state: State<'_, V2RayProc>) {
  let v2ray_proc = state.0.clone();
  if let Some(mut proc) = v2ray_proc.lock().await.take() {
    // 如果存在旧的 v2ray 进程，先关闭。
    let _ = proc.kill().await;
  };
}

async fn start_v2ray_server<R: Runtime>(
  config: &str,
  h: AppHandle<R>,
  state: State<'_, V2RayProc>,
) -> anyhow::Result<String> {
  emit_log(&h, "log::v2ray", "starting v2ray core server...");
  let v2ray_proc = state.0.clone();
  if let Some(mut proc) = v2ray_proc.lock().await.take() {
    // 如果存在旧的 v2ray 进程，先关闭。
    let _ = proc.kill().await;
  }

  let resource_path = h.path().resource_dir()?;
  // println!("{:?}", resource_path);
  let v2ray_bin_dir = resource_path.join("v2ray");
  if !v2ray_bin_dir.exists() {
    anyhow::bail!("v2ray not found.");
    // std::fs::remove_dir_all(&v2ray_bin_dir)?;
  }
  let config_file = v2ray_bin_dir.join("config.json");
  tokio::fs::write(&config_file, config).await?;

  let v2ray_bin = v2ray_bin_dir.join(if cfg!(target_os = "windows") {
    "v2ray.exe"
  } else {
    "v2ray"
  });

  let mut command = tokio::process::Command::new(v2ray_bin);
  command.arg("run");
  command.arg("-c");
  command.arg("./config.json");
  command.stdout(std::process::Stdio::piped());
  command.stderr(std::process::Stdio::piped());
  command.stdin(std::process::Stdio::piped());
  command.current_dir(v2ray_bin_dir);

  #[cfg(target_os = "windows")]
  command.creation_flags(0x08000000);

  let mut proc = command.spawn()?;
  let pid = proc.id().unwrap();
  emit_log(&h, "log::v2ray", &format!("v2ray core pid: {}", pid));

  tokio::task::spawn(async move {
    drop(proc.stdin.take());
    let stdo = proc.stdout.take().unwrap();
    let stde = proc.stderr.take().unwrap();
    {
      v2ray_proc.clone().lock().await.replace(proc);
    }

    tokio::join!(read(stdo, &h), read(stde, &h));
    // let mut buffer = Vec::<u8>::with_capacity(10);

    {
      v2ray_proc.clone().lock().await.take();
    }
  });

  Ok(format!("{{\"pid\":{}}}", pid))
}

#[tauri::command]
pub async fn tauri_start_v2ray_server<R: Runtime>(
  config: &str,
  handle: AppHandle<R>,
  state: State<'_, V2RayProc>,
) -> TAResult<String> {
  start_v2ray_server(config, handle, state)
    .await
    .into_ta_result()
}

#[tauri::command]
pub async fn tauri_stop_v2ray_server<R: Runtime>(
  handle: AppHandle<R>,
  state: State<'_, V2RayProc>,
) -> TAResult<()> {
  stop_v2ray_server(state).await;
  emit_log(&handle, "log::v2ray", "v2ray core server stopped.");
  Ok(())
}

const fn get_platform_zip_file() -> &'static str {
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
    if cfg!(target_arch = "aarch64") {
      "resources/v2ray-android-arm64.zip"
    } else if cfg!(target_arch = "x86_64") {
      "resources/v2ray-android-x86_64.zip"
    } else {
      ""
    }
  } else {
    ""
  }
}

pub fn extract_v2ray_if_need<R: Runtime>(h: &AppHandle<R>) -> anyhow::Result<()> {
  let resource_path = h.path().resource_dir()?;
  // println!("{:?}", resource_path);
  let v2ray_bin_dir = resource_path.join("v2ray");
  if v2ray_bin_dir.exists() {
    emit_log(
      h,
      "log::sys",
      "V2Ray 目录已存在，跳过首次启动解压缩 V2Ray 压缩包",
    );
    return Ok(());
    // std::fs::remove_dir_all(&v2ray_bin_dir)?;
  }
  emit_log(h, "log::sys", "首次启动，开始解压缩 V2Ray 压缩包...");
  let zip_file: &str = &get_platform_zip_file();
  let zip_file_path = resource_path.join(zip_file);
  // println!("{:?}", zip_file_path);
  let buf = std::fs::read(&zip_file_path)?;
  // println!("buf: {:?}", buf.len());

  std::fs::create_dir(&v2ray_bin_dir)?;
  // println!("begin extract");
  zip_extract::extract(Cursor::new(buf), &v2ray_bin_dir, true)?;
  // println!("extract done");
  emit_log(h, "log::sys", "V2Ray 压缩包解压完成");
  Ok(())
}
