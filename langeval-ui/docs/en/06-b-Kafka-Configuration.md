# Kafka Configuration Guide

## Overview

All Kafka configurations (topic names, group IDs, bootstrap servers) are centralized in environment variables to avoid hardcoding and ensure consistency across all microservices.

## Configuration Files

### `.env.example`
A template file containing all necessary environment variables. Copy this file to `.env` and adjust the values as needed:

```bash
cp .env.example .env
```

### Kafka Environment Variables

| Variable | Description | Default Value |
|----------------|-------|------------------|
| `KAFKA_BOOTSTRAP_SERVERS` | Kafka broker address | `kafka:29092` |
| `KAFKA_TOPIC_SIMULATION_REQUESTS` | Topic for simulation requests | `simulation.requests` |
| `KAFKA_TOPIC_SIMULATION_COMPLETED` | Topic for simulation results | `simulation.completed` |
| `KAFKA_TOPIC_EVALUATION_REQUESTS` | Topic for evaluation requests | `evaluation.requests` |
| `KAFKA_TOPIC_EVALUATION_COMPLETED` | Topic for evaluation results | `evaluation.completed` |
| `KAFKA_TOPIC_TRACES` | Topic for observability traces | `traces` |
| `KAFKA_GROUP_SIMULATION` | Consumer group ID for simulation-worker | `simulation-group` |
| `KAFKA_GROUP_EVALUATION` | Consumer group ID for evaluation-worker | `evaluation-group` |
| `KAFKA_GROUP_INGESTION` | Consumer group ID for data-ingestion | `ingestion-group-rust` |

## Services Using Kafka

### 1. Orchestrator
- **Role**: Producer
- **Topics Used**: 
  - `KAFKA_TOPIC_SIMULATION_REQUESTS` (produce)
  - `KAFKA_TOPIC_EVALUATION_REQUESTS` (produce)

### 2. Simulation Worker
- **Role**: Consumer & Producer
- **Topics Used**:
  - `KAFKA_TOPIC_SIMULATION_REQUESTS` (consume)
  - `KAFKA_TOPIC_SIMULATION_COMPLETED` (produce)
  - `KAFKA_TOPIC_TRACES` (produce)
- **Consumer Group**: `KAFKA_GROUP_SIMULATION`

### 3. Evaluation Worker
- **Role**: Consumer & Producer
- **Topics Used**:
  - `KAFKA_TOPIC_EVALUATION_REQUESTS` (consume)
  - `KAFKA_TOPIC_EVALUATION_COMPLETED` (produce)
  - `KAFKA_TOPIC_TRACES` (produce)
- **Consumer Group**: `KAFKA_GROUP_EVALUATION`

### 4. Data Ingestion (Rust)
- **Role**: Consumer
- **Topics Used**:
  - `KAFKA_TOPIC_TRACES` (consume)
- **Consumer Group**: `KAFKA_GROUP_INGESTION`

## How to Modify Configuration

### Changing a Topic Name

1. Update the `.env` file:
```bash
KAFKA_TOPIC_TRACES=my-custom-traces-topic
```

2. Restart the relevant services:
```bash
docker compose up -d --build data-ingestion simulation-worker evaluation-worker
```

### Changing a Consumer Group

Similarly, update the `KAFKA_GROUP_*` variable in `.env` and restart the service.

## Important Notes

- **Consistency**: All services read from the same environment variable source, ensuring no discrepancies.
- **Default values**: Each service has default values in the code, so the system remains functional even without an `.env` file.
- **Docker Compose**: The `docker-compose.yml` file automatically injects environment variables into the containers.
