use actix_web::{get, web, App, HttpResponse, HttpServer, Responder};
use log::{info, error};
use rdkafka::config::ClientConfig;
use rdkafka::consumer::{Consumer, StreamConsumer};
use rdkafka::Message;
use std::env;
use std::time::Duration;
use tokio::time::sleep;
use metrics::{counter, describe_counter};
use metrics_exporter_prometheus::{PrometheusBuilder, PrometheusHandle};

#[get("/metrics")]
async fn prom_metrics(handle: web::Data<PrometheusHandle>) -> impl Responder {
    handle.render()
}

#[get("/health")]
async fn health_check() -> impl Responder {
    HttpResponse::Ok().json(serde_json::json!({
        "status": "ok",
        "service": "data-ingestion",
        "lang": "rust"
    }))
}

mod db;
use db::{DbClient, TraceLog};
use std::time::SystemTime;

async fn kafka_loop() {
    let brokers = env::var("KAFKA_BOOTSTRAP_SERVERS").unwrap_or_else(|_| "kafka:29092".to_string());
    let group_id = env::var("KAFKA_GROUP_INGESTION").unwrap_or_else(|_| "ingestion-group-rust".to_string());
    let topic = env::var("KAFKA_TOPIC_TRACES").unwrap_or_else(|_| "traces".to_string());
    let _dlq_path = env::var("DLQ_PATH").unwrap_or_else(|_| "./dlq.jsonl".to_string());

    let db_client = DbClient::new();

    info!("Starting Kafka Consumer for topic: {}", topic);
    
    // Batch Config
    let batch_size = 50;
    let flush_interval = Duration::from_secs(5);
    let mut batch: Vec<TraceLog> = Vec::new();
    let mut last_flush = std::time::Instant::now();

    loop {
        let consumer: Result<StreamConsumer, _> = ClientConfig::new()
            .set("group.id", &group_id)
            .set("bootstrap.servers", &brokers)
            .set("enable.partition.eof", "false")
            .set("session.timeout.ms", "6000")
            .set("enable.auto.commit", "true")
            .create();

        match consumer {
            Ok(consumer) => {
                info!("Consumer created. Subscribing...");
                if let Err(e) = consumer.subscribe(&[&topic]) {
                    error!("Subscription failed: {}", e);
                    sleep(Duration::from_secs(5)).await;
                    continue;
                }

                loop {
                    // 1. Check for Flush Time
                    if !batch.is_empty() && last_flush.elapsed() >= flush_interval {
                        info!("Flush timeout reached. Ingesting {} logs...", batch.len());
                        if let Err(e) = db_client.insert_batch("traces", &batch).await {
                             error!("Batch Insert Failed: {}", e);
                             counter!("ingestion_errors_total", 1); 
                             // Minimal DLQ: Append to file
                             // In production: Retry or Push to DLQ Kafka Topic
                        } else {
                             counter!("ingestion_batch_flush_total", 1);
                        }
                        batch.clear();
                        last_flush = std::time::Instant::now();
                    }

                    // 2. Consume Message
                    // Use tokio timeout to allow periodic flush even if no messages
                    let msg_result = tokio::time::timeout(Duration::from_secs(1), consumer.recv()).await;

                    match msg_result {
                        Ok(Ok(m)) => {
                            if let Some(Ok(payload)) = m.payload_view::<str>() {
                                // Parse & Convert
                                // Assume payload is JSON. We need to extract basic fields.
                                // specific fields depend on payload structure. 
                                let log_entry = TraceLog {
                                     id: uuid::Uuid::new_v4().to_string(),
                                     campaign_id: "unknown".to_string(), // Extract from JSON in real impl
                                     service: "ingestion".to_string(),
                                     event: "trace".to_string(),
                                     timestamp: SystemTime::now().duration_since(SystemTime::UNIX_EPOCH).unwrap().as_secs() as i64,
                                     payload: payload.to_string(),
                                };
                                batch.push(log_entry);
                                counter!("ingested_logs_total", 1);
                            }
                        }
                        Ok(Err(e)) => {
                             error!("Kafka Error: {}", e);
                             counter!("ingestion_errors_total", 1);
                             sleep(Duration::from_secs(1)).await;
                        }
                        Err(_) => {
                            // Timeout, just continue to check flush condition
                        }
                    }

                    // 3. Check Batch Size
                    if batch.len() >= batch_size {
                         info!("Batch size reached. Ingesting {} logs...", batch.len());
                         if let Err(e) = db_client.insert_batch("traces", &batch).await {
                             error!("Batch Insert Failed: {}", e);
                         }
                         batch.clear();
                         last_flush = std::time::Instant::now();
                    }
                }
            }
            Err(e) => {
                error!("Failed to create consumer: {}", e);
                sleep(Duration::from_secs(5)).await;
            }
        }
    }
}

#[tokio::main]
async fn main() -> std::io::Result<()> {
    env_logger::init_from_env(env_logger::Env::new().default_filter_or("info"));

    // Init Prometheus
    let builder = PrometheusBuilder::new();
    let handle = builder.install_recorder().expect("failed to install Prometheus recorder");

    // Describe metrics
    describe_counter!("ingested_logs_total", "Total number of logs consumed from Kafka");
    describe_counter!("ingestion_errors_total", "Total number of ingestion errors");
    describe_counter!("ingestion_batch_flush_total", "Total number of successful batch flushes to ClickHouse");

    // Spawn Kafka Consumer
    tokio::spawn(async {
        kafka_loop().await;
    });

    info!("Starting HTTP Server on 0.0.0.0:8080");

    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(handle.clone()))
            .service(health_check)
            .service(prom_metrics)
    })
    .bind(("0.0.0.0", 8080))?
    .run()
    .await
}
