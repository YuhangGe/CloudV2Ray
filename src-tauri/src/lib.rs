mod tencent;
mod test;
mod util;
mod v2ray;

use tencent::{
  tauri_call_tencent_cvm_api, tauri_call_tencent_tat_api, tauri_call_tencent_vpc_api,
  tauri_init_tencent_cvm_client, tauri_init_tencent_tat_client, tauri_init_tencent_vpc_client,
};
use test::tauri_start_v2ray;
use test::tauri_test;
use util::tauri_generate_uuid;
use v2ray::tauri_ping_v2ray_agent;

// const TRAY_MENU_QUIT: &str = "quit";
// const TRAY_MENU_SETTING: &str = "setting";

// fn toggle_window(app: &AppHandle) {
//   if let Some(win) = app.get_window("setting") {
//     if let Ok(vis) = win.is_visible() {
//       if vis == false {
//         win.show().unwrap();
//       }
//     }
//     win.set_focus().unwrap();
//     return;
//   }
//   let setting_window = WindowBuilder::new(app, "setting", Window::App("index.html".into()))
//     .build()
//     .unwrap();

//   setting_window
//     .set_title("CloudV2Ray - 基于云计算的 V2Ray 客户端")
//     .unwrap();
//   setting_window.show().unwrap();
//   setting_window.set_focus().unwrap();
// }

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  // let quit = CustomMenuItem::new(TRAY_MENU_QUIT, "退出");
  // let setting = CustomMenuItem::new(TRAY_MENU_SETTING, "设置");

  // let tray_menu = SystemTrayMenu::new()
  //   .add_item(setting)
  //   .add_native_item(SystemTrayMenuItem::Separator)
  //   .add_item(quit);
  // let tray = SystemTray::new()
  //   .with_menu(tray_menu)
  //   .with_tooltip("CloudV2Ray - 基于云计算的 v2ray 客户端");
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
      tauri_init_tencent_cvm_client,
      tauri_call_tencent_cvm_api,
      tauri_init_tencent_vpc_client,
      tauri_call_tencent_vpc_api,
      tauri_call_tencent_tat_api,
      tauri_init_tencent_tat_client,
      tauri_ping_v2ray_agent,
      tauri_generate_uuid,
      tauri_test,
      tauri_start_v2ray,
    ])
    // .plugin(tauri_plugin_shell::init())
    .setup(|_| {
      // tauri::async_runtime::spawn(async move {

      // });
      Ok(())
    })
    // .system_tray(tray)
    // .on_system_tray_event(|app, event| match event {
    //   SystemTrayEvent::LeftClick { .. } => {
    //     toggle_window(app);
    //   }
    //   SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
    //     TRAY_MENU_QUIT => std::process::exit(0),
    //     TRAY_MENU_SETTING => {
    //       toggle_window(app);
    //     }
    //     _ => {}
    //   },
    //   _ => {}
    // })
    // .run(|_app_handle, event| match event {
    //   tauri::RunEvent::ExitRequested { api, .. } => {
    //     api.prevent_exit();
    //   }
    //   _ => {}
    // })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");

  // tauri::Builder::default()
  //   .run(tauri::generate_context!())
  //   .expect("error while running tauri application");
}
