mod sysproxy;
mod tencent;
mod test;
mod util;
mod v2ray;

use sysproxy::{tauri_is_sysproxy_enabled, tauri_set_sysproxy};
#[cfg(not(target_os = "android"))]
use tauri::{
  image::Image,
  menu::{Menu, PredefinedMenuItem},
  tray::{MouseButton, TrayIconBuilder, TrayIconEvent},
};
use tauri::{AppHandle, Manager, WebviewWindowBuilder};
use tauri_plugin_dialog::DialogExt;
use tencent::tauri_calc_tencent_cloud_api_signature;
use test::tauri_test;
use util::{get_platform_zip_file, tauri_exit_process, tauri_generate_uuid, tauri_open_devtools};
use v2ray::{
  extract_v2ray_if_need, tauri_start_v2ray_server, tauri_stop_v2ray_server, V2RayManager,
};

#[cfg(not(target_os = "android"))]
const APP_TITLE: &str = "CloudV2Ray - 基于云计算的 V2Ray 客户端";

fn open_window(app: &AppHandle) {
  if let Some(_win) = app.get_webview_window("main") {
    #[cfg(target_os = "windows")]
    {
      _win.show().unwrap();
      _win.set_focus().unwrap();
    }

    #[cfg(target_os = "macos")]
    tauri::AppHandle::show(&app.app_handle()).unwrap();
    return;
  }
  let mut setting_window = WebviewWindowBuilder::new(app, "main", tauri::WebviewUrl::default());
  #[cfg(not(target_os = "android"))]
  {
    setting_window = setting_window
      .title(APP_TITLE)
      .inner_size(800., 600.)
      .center();
  }

  let setting_window = setting_window.build().unwrap();

  #[cfg(not(target_os = "android"))]
  {
    setting_window.show().unwrap();
    setting_window.set_focus().unwrap();
  }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  let mut app = tauri::Builder::default()
    // .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_http::init())
    .plugin(tauri_plugin_dialog::init())
    .manage(V2RayManager::new())
    .invoke_handler(tauri::generate_handler![
      tauri_calc_tencent_cloud_api_signature,
      tauri_start_v2ray_server,
      tauri_stop_v2ray_server,
      tauri_generate_uuid,
      tauri_open_devtools,
      tauri_exit_process,
      tauri_is_sysproxy_enabled,
      tauri_set_sysproxy,
      tauri_test,
    ])
    // .plugin(tauri_plugin_shell::init())
    .setup(|app| {
      if get_platform_zip_file().eq("") {
        app.dialog().message("不支持当前平台！").blocking_show();
        std::process::exit(-1);
      }

      #[cfg(not(target_os = "android"))]
      {
        if let Err(e) = extract_v2ray_if_need(app.handle()) {
          eprintln!("{}", e);
          app.dialog().message("解压 V2Ray 异常").blocking_show();
          std::process::exit(-1);
        }

        let tray_menu = Menu::with_items(
          app.handle(),
          &[&PredefinedMenuItem::quit(app.handle(), Some("退出"))?],
        )
        .unwrap();

        let _tray = TrayIconBuilder::new()
          .icon(Image::from_bytes(include_bytes!("../icons/64x64.png"))?)
          .tooltip(APP_TITLE)
          .menu(&tray_menu)
          .build(app.handle());

        app.on_tray_icon_event(|tray, event| {
          if let TrayIconEvent::Click { button, .. } = event {
            if matches!(button, MouseButton::Left) {
              let app = tray.app_handle();
              open_window(app);
            }
          }
        });
      }

      #[cfg(target_os = "macos")]
      app.set_activation_policy(tauri::ActivationPolicy::Accessory);

      open_window(app.handle());

      Ok(())
    });

  #[cfg(not(target_os = "android"))]
  {
    app = app.on_window_event(|window, event| match event {
      tauri::WindowEvent::CloseRequested { api, .. } => {
        #[cfg(target_os = "windows")]
        {
          window.hide().unwrap();
        }

        #[cfg(target_os = "macos")]
        {
          tauri::AppHandle::hide(&window.app_handle()).unwrap();
        }

        api.prevent_close();
      }
      _ => {}
    });
  }

  app
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
