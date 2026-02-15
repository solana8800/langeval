# 08. Operations & Cost Analysis

## 1. Cost Model Estimation

Chi phí vận hành hệ thống bao gồm 2 phần chính: **Infrastructure** và **LLM API Usage** (phần lớn nhất).

### 1.1. LLM Token Cost (The Evaluation Cost)
Giả sử ta dùng model "GPT-4o" để đánh giá (Judge).
*   Avg Input: 1000 tokens (Context + Response).
*   Avg Output: 50 tokens (Score + Reason).
*   Price: Input \$5/1M, Output \$15/1M.
*   Cost per Eval: \$0.005 + \$0.00075 = **$0.00575** (approx 0.6 cents).

**Estimation for 10M requests/month:**
*   Total Cost = 10,000,000 * $0.00575 = **$57,500 / month**.
> *High cost! Cần tối ưu.*

### 1.2. Infrastructure Cost (AWS/GKE)
*   K8s Cluster (3 nodes m6g.xlarge): ~$400/mo.
*   Managed DBs (RDS, Kafka, ClickHouse Cloud): ~$1500/mo.
*   **Total Infra**: ~$2,000 / month.

## 2. Cost Optimization Strategies

Để giảm chi phí LLM Eval xuống mức chấp nhận được.

### 2.1. Statistical Sampling
Không cần eval 100% traffic.
*   **Strategy**: Random sample 10% traffic hoặc Smart Sample (chỉ eval các hội thoại dài).
*   **Impact**: Giảm chi phí 10 lần -> **$5,750 / month**.

### 2.2. Model Cascading (The "Judge Hierarchy")
Sử dụng model rẻ cho metrics dễ, model đắt cho metrics khó.
*   **Regex/Keyword Metrics**: Free (Python code).
*   **Toxicity/Sentiment**: Dùng Small Model (Haiku/GPT-3.5) hoặc Specialized BERT -> Cost cực thấp.
*   **Hallucination/Logic**: Mới dùng GPT-4o.

Phân bổ: 80% metrics rẻ, 20% metrics đắt.
*   **Impact**: Giảm thêm 50% chi phí.

### 2.3. Semantic Caching
Nếu một câu hỏi/trả lời đã được đánh giá trước đó (trùng lặp), dùng lại kết quả từ Cache.
*   Sử dụng Redis để cache hash của `(input + output)`.

## 3. Operational Runbooks

Các kịch bản vận hành thường gặp (SOP).

### 3.1. Incident: High Evaluation Latency
*   **Triệu chứng Alert**: `Avg Eval Time > 30s`.
*   **Nguyên nhân**:
    1.  LLM Provider API bị chậm (OpenAI lag).
    2.  Kafka Consumer bị nghẽn (Lag tăng cao).
*   **Action**:
    1.  Check Dashboard: OpenAI Status.
    2.  Nếu do Kafka Lag: Chạy lệnh scale manual HPA hoặc thêm partitions.
    `kubectl scale deployment scoring-worker --replicas=20`

### 3.2. Incident: Cost Spike
*   **Triệu chứng Alert**: `Daily Spend > $500`.
*   **Nguyên nhân**: Một Project đang spam request hoặc bị tấn công loop.
*   **Action**:
    1.  Identify TenantID có usage cao nhất.
    2.  Tạm thời disable Ingestion cho Tenant đó hoặc bật Aggressive Sampling (1%).
    3.  Liên hệ user để check.

## 4. Maintenance Schedule
*   **Weekly**: Review metrics performance report. Update prompt configs nếu LLM model version thay đổi.
*   **Monthly**: Rotate API Keys. Review Database disk usage (ClickHouse retention).
*   **Quarterly**: Penetration Test (Security Audit).
