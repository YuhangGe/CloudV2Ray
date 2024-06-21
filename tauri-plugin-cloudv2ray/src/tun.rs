use std::{io::Cursor, sync::Arc};

use tauri::{AppHandle, Manager, Runtime};

use crate::util::emit_log;

use anyhow_tauri::{IntoTAResult, TAResult};
use tauri::State;
use tokio::{
  io::{AsyncBufReadExt, AsyncRead},
  process::Child,
  sync::Mutex,
};

pub struct Tun2SocksProc(Arc<Mutex<Option<Child>>>);

impl Tun2SocksProc {
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
          emit_log(h, "log::tun2socks", &l);
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

pub async fn stop_tun2socks_server(state: State<'_, Tun2SocksProc>) {
  let v2ray_proc = state.0.clone();
  if let Some(mut proc) = v2ray_proc.lock().await.take() {
    // 如果存在旧的 v2ray 进程，先关闭。
    let _ = proc.kill().await;
  };
}

async fn start_tun2socks_server<R: Runtime>(
  config: &str,
  files_dir: &str,
  libs_dir: &str,
  h: AppHandle<R>,
  state: State<'_, Tun2SocksProc>,
) -> anyhow::Result<String> {
  use std::path::PathBuf;

  emit_log(&h, "log::tun2socks", "starting tun2socks server...");
  let tun_proc = state.0.clone();
  if let Some(mut proc) = tun_proc.lock().await.take() {
    // 如果存在旧的 v2ray 进程，先关闭。
    let _ = proc.kill().await;
  }

  // println!("{:?}", resource_path);
  let tun_bin = PathBuf::from(libs_dir).join("libsockstun.so");
  if !tun_bin.exists() {
    anyhow::bail!("tun2socks not found.");
    // std::fs::remove_dir_all(&v2ray_bin_dir)?;
  }
  let cwd = PathBuf::from(files_dir);
  let config_file = cwd.join("conf.yaml");
  tokio::fs::write(&config_file, config).await?;

  let mut command = tokio::process::Command::new(tun_bin);
  command.arg(config_file.to_str().unwrap());
  command.stdout(std::process::Stdio::piped());
  command.stderr(std::process::Stdio::piped());
  command.stdin(std::process::Stdio::piped());
  command.current_dir(files_dir);

  let mut proc = command.spawn()?;
  let pid = proc.id().unwrap();
  emit_log(&h, "log::v2ray", &format!("tun2socks pid: {}", pid));

  tokio::task::spawn(async move {
    drop(proc.stdin.take());
    let stdo = proc.stdout.take().unwrap();
    let stde = proc.stderr.take().unwrap();
    {
      tun_proc.clone().lock().await.replace(proc);
    }

    tokio::join!(read(stdo, &h), read(stde, &h));
    // let mut buffer = Vec::<u8>::with_capacity(10);

    {
      tun_proc.clone().lock().await.take();
    }
  });

  Ok(format!("{{\"pid\":{}}}", pid))
}

#[tauri::command]
pub async fn tauri_start_tun2socks_server<R: Runtime>(
  config: &str,
  vpn_fd: i64,
  files_dir: &str,
  libs_dir: &str,
  handle: AppHandle<R>,
  state: State<'_, Tun2SocksProc>,
) -> TAResult<String> {
  start_tun2socks_server(config, files_dir, libs_dir, handle, state)
    .await
    .into_ta_result()
}

#[tauri::command]
pub async fn tauri_stop_tun2socks_server<R: Runtime>(
  handle: AppHandle<R>,
  state: State<'_, Tun2SocksProc>,
) -> TAResult<()> {
  stop_tun2socks_server(state).await;
  emit_log(&handle, "log::v2ray", "tun2socks server stopped.");
  Ok(())
}
