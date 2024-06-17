#[cfg(desktop)]
mod sysproxy;
#[cfg(desktop)]
mod v2ray;

mod tencent;
mod test;
mod util;

use tauri::{AppHandle, Manager, WebviewWindowBuilder};

use tencent::tauri_calc_tencent_cloud_api_signature;
use test::tauri_test;
use util::tauri_generate_uuid;
#[cfg(desktop)]
use util::tauri_open_devtools;

#[cfg(desktop)]
use sysproxy::{tauri_is_sysproxy_enabled, tauri_set_sysproxy};
#[cfg(desktop)]
use tauri::{
  image::Image,
  menu::{Menu, PredefinedMenuItem},
  tray::{MouseButton, TrayIconBuilder, TrayIconEvent},
};
#[cfg(desktop)]
use util::tauri_exit_process;
#[cfg(desktop)]
use v2ray::{extract_v2ray_if_need, tauri_start_v2ray_server, tauri_stop_v2ray_server, V2RayProc};

#[cfg(desktop)]
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
  #[cfg(desktop)]
  {
    let setting_window = WebviewWindowBuilder::new(app, "main", tauri::WebviewUrl::default())
      .title(APP_TITLE)
      .inner_size(800., 600.)
      .center()
      .initialization_script(if cfg!(windows) {
        "window.__TAURI_PLATFORM__ = 'windows'"
      } else {
        "window.__TAURI_PLATFORM__ = 'macos'"
      })
      .build()
      .unwrap();
    setting_window.show().unwrap();
    setting_window.set_focus().unwrap();
  }
  #[cfg(mobile)]
  WebviewWindowBuilder::new(app, "main", tauri::WebviewUrl::default())
    .initialization_script("window.__TAURI_PLATFORM__ = 'android'")
    .build()
    .unwrap();
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  let mut app = tauri::Builder::default()
    .plugin(tauri_plugin_http::init())
    // .plugin(tauri_plugin_dialog::init())
    .invoke_handler(tauri::generate_handler![
      tauri_calc_tencent_cloud_api_signature,
      tauri_generate_uuid,
      tauri_test,
      #[cfg(desktop)]
      tauri_open_devtools,
      #[cfg(desktop)]
      tauri_exit_process,
      #[cfg(desktop)]
      tauri_is_sysproxy_enabled,
      #[cfg(desktop)]
      tauri_set_sysproxy,
      #[cfg(desktop)]
      tauri_start_v2ray_server,
      #[cfg(desktop)]
      tauri_stop_v2ray_server
    ])
    // .plugin(tauri_plugin_shell::init())
    .setup(|app| {
      #[cfg(desktop)]
      {
        if let Err(e) = extract_v2ray_if_need(app.handle()) {
          eprintln!("解压 V2Ray 异常: {}", e);
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

        app.manage(V2RayProc::new());
      }

      #[cfg(target_os = "macos")]
      app.set_activation_policy(tauri::ActivationPolicy::Accessory);

      open_window(app.handle());

      Ok(())
    });

  #[cfg(mobile)]
  {
    app = app.plugin(tauri_plugin_cloudv2ray::init());
  }
  #[cfg(desktop)]
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
