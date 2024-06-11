mod sysproxy;
mod tencent;
mod test;
mod util;
mod v2ray;

use sysproxy::{tauri_is_sysproxy_enabled, tauri_set_sysproxy};
use tauri::image::Image;
#[cfg(not(target_os = "android"))]
use tauri::{
  // menu::{Menu, PredefinedMenuItem},
  tray::{TrayIconBuilder, TrayIconEvent},
};
use tauri::{AppHandle, Manager, WebviewWindowBuilder};
use tauri_plugin_dialog::DialogExt;
use tencent::{
  tauri_call_tencent_bill_api, tauri_call_tencent_cvm_api, tauri_call_tencent_tat_api,
  tauri_call_tencent_vpc_api, tauri_init_tencent_bill_client, tauri_init_tencent_cvm_client,
  tauri_init_tencent_tat_client, tauri_init_tencent_vpc_client,
};
use test::tauri_test;
use util::get_platform_zip_file;
use util::{tauri_exit_process, tauri_generate_uuid};
use v2ray::extract_v2ray_if_need;
use v2ray::init_v2ray_manager;
use v2ray::V2RayManager;
use v2ray::{tauri_ping_v2ray_interval, tauri_ping_v2ray_once, tauri_start_v2ray_server};

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
    .manage(V2RayManager::new())
    .invoke_handler(tauri::generate_handler![
      tauri_init_tencent_cvm_client,
      tauri_call_tencent_cvm_api,
      tauri_init_tencent_vpc_client,
      tauri_call_tencent_vpc_api,
      tauri_call_tencent_tat_api,
      tauri_init_tencent_tat_client,
      tauri_call_tencent_bill_api,
      tauri_init_tencent_bill_client,
      tauri_ping_v2ray_once,
      tauri_ping_v2ray_interval,
      tauri_start_v2ray_server,
      tauri_generate_uuid,
      tauri_exit_process,
      tauri_is_sysproxy_enabled,
      tauri_set_sysproxy,
      tauri_test,
    ])
    .plugin(tauri_plugin_dialog::init())
    // .plugin(tauri_plugin_shell::init())
    .setup(|app| {
      if get_platform_zip_file().eq("") {
        app.dialog().message("不支持当前平台！").blocking_show();
        std::process::exit(-1);
      }
      if let Err(e) = extract_v2ray_if_need(app.handle()) {
        eprintln!("{}", e);
        app.dialog().message("解压 V2Ray 异常").blocking_show();
        std::process::exit(-1);
      }

      #[cfg(not(target_os = "android"))]
      {
        // let tray_menu = Menu::with_items(
        //   app.handle(),
        //   &[&PredefinedMenuItem::quit(app.handle(), Some("退出"))?],
        // )
        // .unwrap();

        let _tray = TrayIconBuilder::new()
          .icon(Image::from_bytes(include_bytes!("../icons/128x128.png"))?)
          .tooltip(APP_TITLE)
          // .menu(&tray_menu)
          .build(app.handle());

        app.on_tray_icon_event(|tray, event| {
          if let TrayIconEvent::Click { .. } = event {
            let app = tray.app_handle();
            open_window(app);
          }
        });
      }
      init_v2ray_manager(app.handle(), app.state::<V2RayManager>());

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
