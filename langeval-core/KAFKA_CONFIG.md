# Kafka Configuration Guide

## Tổng quan

Toàn bộ cấu hình Kafka (topic names, group IDs, bootstrap servers) đã được tập trung vào biến môi trường để tránh hardcode và đảm bảo tính nhất quán giữa các service.

## File cấu hình

### `.env.example`
File mẫu chứa tất cả các biến môi trường cần thiết. Copy file này thành `.env` và điều chỉnh giá trị theo nhu cầu:

```bash
cp .env.example .env
```

### Các biến môi trường Kafka

| Biến môi trường | Mô tả | Giá trị mặc định |
|----------------|-------|------------------|
| `KAFKA_BOOTSTRAP_SERVERS` | Địa chỉ Kafka broker | `kafka:29092` |
| `KAFKA_TOPIC_SIMULATION_REQUESTS` | Topic cho simulation requests | `simulation.requests` |
| `KAFKA_TOPIC_SIMULATION_COMPLETED` | Topic cho simulation results | `simulation.completed` |
| `KAFKA_TOPIC_EVALUATION_REQUESTS` | Topic cho evaluation requests | `evaluation.requests` |
| `KAFKA_TOPIC_EVALUATION_COMPLETED` | Topic cho evaluation results | `evaluation.completed` |
| `KAFKA_TOPIC_TRACES` | Topic cho observability traces | `traces` |
| `KAFKA_GROUP_SIMULATION` | Consumer group ID cho simulation-worker | `simulation-group` |
| `KAFKA_GROUP_EVALUATION` | Consumer group ID cho evaluation-worker | `evaluation-group` |
| `KAFKA_GROUP_INGESTION` | Consumer group ID cho data-ingestion | `ingestion-group-rust` |

## Services sử dụng Kafka

### 1. Orchestrator
- **Vai trò**: Producer
- **Topics sử dụng**: 
  - `KAFKA_TOPIC_SIMULATION_REQUESTS` (produce)
  - `KAFKA_TOPIC_EVALUATION_REQUESTS` (produce)

### 2. Simulation Worker
- **Vai trò**: Consumer & Producer
- **Topics sử dụng**:
  - `KAFKA_TOPIC_SIMULATION_REQUESTS` (consume)
  - `KAFKA_TOPIC_SIMULATION_COMPLETED` (produce)
  - `KAFKA_TOPIC_TRACES` (produce)
- **Consumer Group**: `KAFKA_GROUP_SIMULATION`

### 3. Evaluation Worker
- **Vai trò**: Consumer & Producer
- **Topics sử dụng**:
  - `KAFKA_TOPIC_EVALUATION_REQUESTS` (consume)
  - `KAFKA_TOPIC_EVALUATION_COMPLETED` (produce)
  - `KAFKA_TOPIC_TRACES` (produce)
- **Consumer Group**: `KAFKA_GROUP_EVALUATION`

### 4. Data Ingestion (Rust)
- **Vai trò**: Consumer
- **Topics sử dụng**:
  - `KAFKA_TOPIC_TRACES` (consume)
- **Consumer Group**: `KAFKA_GROUP_INGESTION`

## Cách thay đổi cấu hình

### Thay đổi tên topic

1. Cập nhật file `.env`:
```bash
KAFKA_TOPIC_TRACES=my-custom-traces-topic
```

2. Restart các service liên quan:
```bash
docker compose up -d --build data-ingestion simulation-worker evaluation-worker
```

### Thay đổi consumer group

Tương tự, cập nhật biến `KAFKA_GROUP_*` trong `.env` và restart service.

## Lưu ý

- **Tính nhất quán**: Tất cả các service đều đọc từ cùng một nguồn biến môi trường, đảm bảo không có sai lệch.
- **Default values**: Mỗi service đều có giá trị mặc định trong code, nên hệ thống vẫn hoạt động ngay cả khi không có file `.env`.
- **Docker Compose**: File `docker-compose.yml` tự động inject các biến môi trường vào container.
