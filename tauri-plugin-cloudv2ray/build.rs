const COMMANDS: &[&str] = &["startV2RayCore", "stopV2RayCore", "startVpn", "stopVpn"];

fn main() {
  tauri_plugin::Builder::new(COMMANDS)
    .android_path("android")
    .ios_path("ios")
    .build();
}
