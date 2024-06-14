use serde::de::DeserializeOwned;
use tauri::{plugin::PluginApi, AppHandle, Runtime};

use crate::models::*;

pub fn init<R: Runtime, C: DeserializeOwned>(
  app: &AppHandle<R>,
  _api: PluginApi<R, C>,
) -> crate::Result<Cloudv2ray<R>> {
  Ok(Cloudv2ray(app.clone()))
}

/// Access to the cloudv2ray APIs.
pub struct Cloudv2ray<R: Runtime>(AppHandle<R>);

impl<R: Runtime> Cloudv2ray<R> {
  pub fn ping(&self, payload: PingRequest) -> crate::Result<PingResponse> {
    Ok(PingResponse {
      value: payload.value,
    })
  }
}
