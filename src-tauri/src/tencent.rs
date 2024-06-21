use anyhow_tauri::{IntoTAResult, TAResult};
use chrono::{TimeZone, Utc};
use hmac::digest::Output;
use hmac::{Hmac, Mac};
use sha2::{Digest, Sha256};
// use tauri::http::StatusCode;
// use tauri_plugin_http::reqwest::{
//   header::{HeaderMap, AUTHORIZATION, CONTENT_TYPE, HOST},
//   Client,
// };
type HmacSha256 = Hmac<Sha256>;

// pub struct TencentCloudClient {
//   secret_key: String,
//   secret_id: String,
//   service: String,
//   version: String,
// }

fn hmac(message: &str, key: &[u8]) -> Output<Sha256> {
  let mut hmac = HmacSha256::new_from_slice(key).unwrap();
  hmac.update(message.as_bytes());
  hmac.finalize().into_bytes()
}

fn calc_tencent_cloud_api_signature(
  secret_id: &str,
  secret_key: &str,
  service: &str,
  timestamp: i64,
  body: &str,
) -> anyhow::Result<String> {
  let hashed_payload = format!("{:x}", Sha256::digest(body.as_bytes()));
  let canonical_request = format!("POST\n/\n\ncontent-type:application/json\nhost:{}.tencentcloudapi.com\n\ncontent-type;host\n{}", service, &hashed_payload);
  let hashed_canonical_request = format!("{:x}", Sha256::digest(canonical_request.as_bytes()));
  // println!("{} {} {}", body, hashed_payload, hashed_canonical_request);
  // println!("{}", canonical_request);
  let date = Utc
    .timestamp_opt(timestamp, 0)
    .unwrap()
    .format("%Y-%m-%d")
    .to_string();
  let credential_scope = format!("{}/{}/tc3_request", date, service);
  let string_to_sign = format!(
    "TC3-HMAC-SHA256\n{}\n{}\n{}",
    timestamp, credential_scope, hashed_canonical_request
  );
  // println!("{}", string_to_sign);
  let secret_date = hmac(&date, format!("TC3{}", secret_key).as_bytes());
  let secret_service = hmac(service, &secret_date);
  let secret_signing = hmac("tc3_request", &secret_service);
  // println!("{:x}", &secret_date);
  // println!("{:x}", &secret_service);
  // println!("{:x}", &secret_signing);

  let signature = hmac(&string_to_sign, &secret_signing);
  Ok(format!(
    "TC3-HMAC-SHA256 Credential={}/{}, SignedHeaders=content-type;host, Signature={:x}",
    secret_id, credential_scope, signature
  ))
}

#[tauri::command]
pub fn tauri_calc_tencent_cloud_api_signature(
  secret_id: &str,
  secret_key: &str,
  service: &str,
  timestamp: i64,
  body: &str,
) -> TAResult<String> {
  calc_tencent_cloud_api_signature(secret_id, secret_key, service, timestamp, body).into_ta_result()
}

// pub async fn call_api(
//   service: &str,
//   version: &str,
//   region: &str,
//   action: &str,
//   timestamp: i64,
//   body: &str,
//   auth: &str,
// ) -> anyhow::Result<String> {
//   let client = Client::new();
//   let mut headers = HeaderMap::new();
//   headers.insert(AUTHORIZATION, auth.parse().unwrap());
//   headers.insert(CONTENT_TYPE, "application/json".parse().unwrap());
//   headers.insert(
//     HOST,
//     format!("{}.tencentcloudapi.com", service).parse().unwrap(),
//   );
//   headers.insert("X-TC-Action", action.parse().unwrap());
//   headers.insert("X-TC-Version", version.parse().unwrap());
//   headers.insert("X-TC-Timestamp", timestamp.to_string().parse().unwrap());
//   headers.insert("X-TC-Region", region.parse().unwrap());
//   // println!("{:?}", headers);
//   println!("start call api...");
//   let x = chrono::Utc::now().timestamp_micros();
//   let resp = client
//     .post(format!("https://{}.tencentcloudapi.com", service))
//     .headers(headers)
//     .body(body.to_string())
//     .timeout(Duration::from_secs(10))
//     .send()
//     .await?;
//   let y = chrono::Utc::now().timestamp_micros();
//   println!("stop call api... {} mills", y - x);
//   let status = resp.status();
//   if status != StatusCode::OK {
//     anyhow::bail!("bad response status: {}", status);
//   }
//   let body = resp.text().await?;
//   // println!("{}", body);
//   Ok(body)
// }

// #[tauri::command]
// pub async fn tauri_call_tencent_cloud_api(
//   service: &str,
//   version: &str,
//   region: &str,
//   action: &str,
//   timestamp: i64,
//   body: &str,
//   auth: &str,
// ) -> TAResult<String> {
//   call_api(service, version, region, action, timestamp, body, auth)
//     .await
//     .into_ta_result()
// }
