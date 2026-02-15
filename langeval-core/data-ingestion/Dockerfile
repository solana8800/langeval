# Builder Stage
FROM rust:latest as builder

WORKDIR /app

# Install Build Dependencies (for rdkafka / openssl)
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    build-essential \
    cmake \
    && rm -rf /var/lib/apt/lists/*

# Create empty project to cache dependencies
RUN mkdir src && echo "fn main() {}" > src/main.rs
COPY Cargo.toml .
RUN cargo build --release

# Build Application
COPY src ./src
# Touch main.rs to force rebuild
RUN touch src/main.rs
RUN cargo build --release

# Runtime Stage
FROM debian:testing-slim

WORKDIR /app

# Install Runtime Dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/target/release/data-ingestion .

CMD ["./data-ingestion"]
