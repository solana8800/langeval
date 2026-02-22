use clickhouse::{Client, Row};
use serde::{Deserialize, Serialize};
use std::env;

#[derive(Debug, Serialize, Deserialize, Row, Clone)]
pub struct TraceLog {
    pub id: String,
    pub campaign_id: String,
    pub service: String,
    pub event: String,
    pub timestamp: i64,
    pub payload: String, // JSON string
}

pub struct DbClient {
    client: Client,
}

impl DbClient {
    pub fn new() -> Self {
        let url = env::var("CLICKHOUSE_URL").unwrap_or_else(|_| "http://clickhouse:8123".to_string());
        let user = env::var("CLICKHOUSE_USER").unwrap_or_else(|_| "default".to_string());
        let password = env::var("CLICKHOUSE_PASSWORD").unwrap_or_else(|_| "".to_string());
        let db = env::var("CLICKHOUSE_DB").unwrap_or_else(|_| "default".to_string());

        let client = Client::default()
            .with_url(url)
            .with_user(user)
            .with_password(password)
            .with_database(db);

        DbClient { client }
    }

    pub async fn insert_batch(&self, table: &str, rows: &[TraceLog]) -> Result<(), Box<dyn std::error::Error>> {
        let mut insert = self.client.insert(table)?;
        
        for row in rows {
            insert.write(row).await?;
        }
        
        insert.end().await?;
        Ok(())
    }
}
