use std::time::Duration;

use anyhow_tauri::{IntoTAResult, TAResult};
use chrono::Utc;
use hmac::digest::Output;
use hmac::{Hmac, Mac};
use once_cell::sync::OnceCell;
use reqwest::header::{HeaderMap, AUTHORIZATION, CONTENT_TYPE, HOST};
use reqwest::{Client, StatusCode};
use sha2::{Digest, Sha256};

type HmacSha256 = Hmac<Sha256>;

pub struct TencentCloudClient {
  secret_key: String,
  secret_id: String,
  service: String,
  version: String,
}

fn hmac(message: &str, key: &[u8]) -> Output<Sha256> {
  let mut hmac = HmacSha256::new_from_slice(key).unwrap();
  hmac.update(message.as_bytes());
  hmac.finalize().into_bytes()
}

impl TencentCloudClient {
  pub fn new(secret_id: String, secret_key: String, service: String, version: String) -> Self {
    Self {
      secret_id,
      secret_key,
      service,
      version,
    }
  }
  fn calc_auth(&self, body: &str) -> (String, i64) {
    let hashed_payload = format!("{:x}", Sha256::digest(body.as_bytes()));
    let canonical_request = format!("POST\n/\n\ncontent-type:application/json\nhost:{}.tencentcloudapi.com\n\ncontent-type;host\n{}", self.service, &hashed_payload);
    let hashed_canonical_request = format!("{:x}", Sha256::digest(canonical_request.as_bytes()));
    // println!("{} {} {}", body, hashed_payload, hashed_canonical_request);
    // println!("{}", canonical_request);
    let now = Utc::now();
    let date = now.format("%Y-%m-%d").to_string();
    let credential_scope = format!("{}/{}/tc3_request", date, self.service);
    let timestamp = now.timestamp();
    let string_to_sign = format!(
      "TC3-HMAC-SHA256\n{}\n{}\n{}",
      timestamp, credential_scope, hashed_canonical_request
    );
    // println!("{}", string_to_sign);
    let secret_date = hmac(&date, format!("TC3{}", self.secret_key).as_bytes());
    let secret_service = hmac(&self.service, &secret_date);
    let secret_signing = hmac("tc3_request", &secret_service);
    // println!("{:x}", &secret_date);
    // println!("{:x}", &secret_service);
    // println!("{:x}", &secret_signing);

    let signature = hmac(&string_to_sign, &secret_signing);

    (
      format!(
        "TC3-HMAC-SHA256 Credential={}/{}, SignedHeaders=content-type;host, Signature={:x}",
        self.secret_id, credential_scope, signature
      ),
      timestamp,
    )
  }

  pub async fn call_api(&self, region: &str, action: &str, body: String) -> anyhow::Result<String> {
    let (auth, timestamp) = self.calc_auth(&body);
    // println!("{}", auth);
    let client = Client::new();
    let mut headers = HeaderMap::new();
    headers.insert(AUTHORIZATION, auth.parse().unwrap());
    headers.insert(CONTENT_TYPE, "application/json".parse().unwrap());
    headers.insert(
      HOST,
      format!("{}.tencentcloudapi.com", self.service)
        .parse()
        .unwrap(),
    );
    headers.insert("X-TC-Action", action.parse().unwrap());
    headers.insert("X-TC-Version", self.version.parse().unwrap());
    headers.insert("X-TC-Timestamp", timestamp.to_string().parse().unwrap());
    headers.insert("X-TC-Region", region.parse().unwrap());
    // println!("{:?}", headers);
    let resp = client
      .post(format!("https://{}.tencentcloudapi.com", self.service))
      .headers(headers)
      .body(body)
      .timeout(Duration::from_secs(10))
      .send()
      .await?;
    let status = resp.status();
    if status != StatusCode::OK {
      anyhow::bail!("bad response status: {}", status);
    }
    let body = resp.text().await?;
    // println!("{}", body);
    Ok(body)
  }
}

static CVM_CLIENT: OnceCell<TencentCloudClient> = OnceCell::new();
static VPC_CLIENT: OnceCell<TencentCloudClient> = OnceCell::new();
static TAT_CLIENT: OnceCell<TencentCloudClient> = OnceCell::new();
static BILL_CLIENT: OnceCell<TencentCloudClient> = OnceCell::new();

fn init_tencent_client(
  client: &OnceCell<TencentCloudClient>,
  service: &str,
  version: &str,
  secret_id: &str,
  secret_key: &str,
) {
  client.get_or_init(|| {
    TencentCloudClient::new(
      secret_id.into(),
      secret_key.into(),
      service.into(),
      version.into(),
    )
  });
}

#[tauri::command]
pub async fn tauri_init_tencent_cvm_client(secret_id: &str, secret_key: &str) -> TAResult<()> {
  init_tencent_client(&CVM_CLIENT, "cvm", "2017-03-12", secret_id, secret_key);
  Ok(())
}

#[tauri::command]
pub async fn tauri_init_tencent_vpc_client(secret_id: &str, secret_key: &str) -> TAResult<()> {
  init_tencent_client(&VPC_CLIENT, "vpc", "2017-03-12", secret_id, secret_key);
  Ok(())
}

#[tauri::command]
pub async fn tauri_init_tencent_tat_client(secret_id: &str, secret_key: &str) -> TAResult<()> {
  init_tencent_client(&TAT_CLIENT, "tat", "2020-10-28", secret_id, secret_key);
  Ok(())
}

#[tauri::command]
pub async fn tauri_init_tencent_bill_client(secret_id: &str, secret_key: &str) -> TAResult<()> {
  init_tencent_client(&BILL_CLIENT, "billing", "2018-07-09", secret_id, secret_key);
  Ok(())
}

pub async fn call_tencent_api(
  client: &OnceCell<TencentCloudClient>,
  region: &str,
  action: &str,
  body: String,
) -> TAResult<String> {
  client
    .get()
    .unwrap()
    .call_api(region, action, body)
    .await
    .into_ta_result()
}

#[tauri::command]
pub async fn tauri_call_tencent_cvm_api(
  region: &str,
  action: &str,
  body: String,
) -> TAResult<String> {
  call_tencent_api(&CVM_CLIENT, region, action, body).await
}

#[tauri::command]
pub async fn tauri_call_tencent_vpc_api(
  region: &str,
  action: &str,
  body: String,
) -> TAResult<String> {
  call_tencent_api(&VPC_CLIENT, region, action, body).await
}

#[tauri::command]
pub async fn tauri_call_tencent_tat_api(
  region: &str,
  action: &str,
  body: String,
) -> TAResult<String> {
  call_tencent_api(&TAT_CLIENT, region, action, body).await
}

#[tauri::command]
pub async fn tauri_call_tencent_bill_api(
  region: &str,
  action: &str,
  body: String,
) -> TAResult<String> {
  call_tencent_api(&BILL_CLIENT, region, action, body).await
}
