use std::{io::Cursor, net::IpAddr, str::FromStr, sync::Arc};

use anyhow::Ok;
use tauri::{AppHandle, Manager, Runtime};
use tun2proxy::{mobile_run, ArgProxy, Args};

use crate::util::emit_log;

use anyhow_tauri::{IntoTAResult, TAResult};
use tauri::State;
use tokio::{
  io::{AsyncBufReadExt, AsyncRead},
  process::Child,
  sync::Mutex,
};

pub struct Tun2SocksProc(Arc<Mutex<Option<tokio_util::sync::CancellationToken>>>);

impl Tun2SocksProc {
  pub fn new() -> Self {
    Self(Arc::new(Mutex::new(None)))
  }
}

pub async fn stop_tun2socks_server(state: State<'_, Tun2SocksProc>) {
  let v2ray_proc = state.0.clone();
  if let Some(proc) = v2ray_proc.lock().await.take() {
    proc.cancel();
  };
}

async fn start_tun2socks_server<R: Runtime>(
  vpn_fd: i32,
  h: AppHandle<R>,
  state: State<'_, Tun2SocksProc>,
) -> anyhow::Result<String> {
  use std::path::PathBuf;

  emit_log(&h, "log::v2ray", "starting tun2socks server...");
  println!("OOOOOOO VPN FD {}", vpn_fd);
  let args = Args {
    tun: None,
    tun_fd: Some(vpn_fd),

    proxy: ArgProxy::try_from("socks5://127.0.0.1:7890").unwrap(),
    ipv6_enabled: false,
    setup: false,
    dns: tun2proxy::ArgDns::Direct,
    dns_addr: IpAddr::from_str("8.8.8.8").unwrap(),
    bypass: vec![],
    tcp_timeout: 600,
    udp_timeout: 10,
    verbosity: tun2proxy::ArgVerbosity::Debug,
  };

  let shutdown_token = tokio_util::sync::CancellationToken::new();
  {
    let v2ray_proc = state.0.clone();
    let mut x = v2ray_proc.lock().await;
    if let Some(proc) = x.take() {
      proc.cancel();
    };
    x.replace(shutdown_token.clone());
  }
  let mut config = tun2::Configuration::default();
  config.raw_fd(vpn_fd);
  println!("prepare device...");
  let device = tun2::create_as_async(&config).map_err(std::io::Error::from)?;
  println!("run tun2proxy...");
  tokio::spawn(tun2proxy::run(device, 8500, args, shutdown_token));
  println!("XXXXXXXX");
  Ok("".into())
  // tokio::task::spawn(async move {});

  // Ok(format!("{{\"pid\":{}}}", pid))
}

// #[tauri::command]
// pub async fn tauri_start_tun2socks_server<R: Runtime>(
//   vpn_fd: i32,
//   handle: AppHandle<R>,
//   state: State<'_, Tun2SocksProc>,
// ) -> TAResult<String> {
//   start_tun2socks_server(vpn_fd, handle, state)
//     .await
//     .into_ta_result()
// }

// #[tauri::command]
// pub async fn tauri_stop_tun2socks_server<R: Runtime>(
//   handle: AppHandle<R>,
//   state: State<'_, Tun2SocksProc>,
// ) -> TAResult<()> {
//   stop_tun2socks_server(state).await;
//   emit_log(&handle, "log::v2ray", "tun2socks server stopped.");
//   Ok(()).into_ta_result()
// }
