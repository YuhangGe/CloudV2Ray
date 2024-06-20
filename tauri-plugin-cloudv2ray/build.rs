const COMMANDS: &[&str] = &[
  "startV2RayCore",
  "stopV2RayCore",
  "startVpn",
  "stopVpn",
  "getMobileDir",
  "tauri_start_v2ray_server",
  "tauri_stop_v2ray_server",
  "register_listener",
];

fn main() {
  tauri_plugin::Builder::new(COMMANDS)
    .android_path("android")
    .ios_path("ios")
    .build();
}
