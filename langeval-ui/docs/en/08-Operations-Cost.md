# 08. Operations & Cost Analysis

## 1. Cost Model Estimation

System operational costs consist of two main components: **Infrastructure** and **LLM API Usage** (the largest portion).

### 1.1. LLM Token Cost (The Evaluation Cost)
Assuming the "GPT-4o" model is used for evaluation (Judge).
*   Avg Input: 1000 tokens (Context + Response).
*   Avg Output: 50 tokens (Score + Reason).
*   Price: Input \$5/1M, Output \$15/1M.
*   Cost per Eval: \$0.005 + \$0.00075 = **$0.00575** (approx 0.6 cents).

**Estimation for 10M requests/month:**
*   Total Cost = 10,000,000 * $0.00575 = **$57,500 / month**.
> *High cost! Optimization is required.*

### 1.2. Infrastructure Cost (AWS/GKE)
*   K8s Cluster (3 nodes m6g.xlarge): ~$400/mo.
*   Managed DBs (RDS, Kafka, ClickHouse Cloud): ~$1500/mo.
*   **Total Infra**: ~$2,000 / month.

---

## 2. Cost Optimization Strategies

To reduce LLM evaluation costs to an acceptable level.

### 2.1. Statistical Sampling
100% evaluation of traffic is not required.
*   **Strategy**: Randomly sample 10% of traffic or Smart Sample (evaluate only longer/complex conversations).
*   **Impact**: Reduces core costs 10x -> **$5,750 / month**.

### 2.2. Model Cascading (The "Judge Hierarchy")
Use cheaper models for simple metrics and expensive ones for complex metrics.
*   **Regex/Keyword Metrics**: Free (Python code).
*   **Toxicity/Sentiment**: Use Small Models (Haiku/GPT-3.5) or Specialized BERT -> Extremely low cost.
*   **Hallucination/Logic**: Reserved for GPT-4o.

**Allocation**: 80% cheap metrics, 20% expensive metrics.
*   **Impact**: Further reduces costs by 50%.

### 2.3. Semantic Caching
If a question/response has been evaluated before (duplicate), reuse the result from the cache.
*   Uses Redis to cache the hash of `(input + output)`.

---

## 3. Operational Runbooks (SOPs)

### 3.1. Incident: High Evaluation Latency
*   **Alert Symptom**: `Avg Eval Time > 30s`.
*   **Causes**:
    1.  LLM Provider API lag (e.g., OpenAI outage).
    2.  Kafka Consumer congestion (high lag).
*   **Actions**:
    1.  Check Dashboard: OpenAI Status.
    2.  If Kafka Lag is found: Manually scale HPA or add partitions.
    `kubectl scale deployment scoring-worker --replicas=20`

### 3.2. Incident: Cost Spike
*   **Alert Symptom**: `Daily Spend > $500`.
*   **Causes**: A specific project is spamming requests or an attack loop is occurring.
*   **Actions**:
    1.  Identify the TenantID with the highest usage.
    2.  Temporarily disable ingestion for that tenant or enable Aggressive Sampling (1%).
    3.  Contact the user for verification.

---

## 4. Maintenance Schedule
*   **Weekly**: Review metrics performance report. Update prompt configs if LLM model versions change.
*   **Monthly**: Rotate API Keys. Review Database disk usage (ClickHouse retention).
*   **Quarterly**: Penetration Test (Security Audit).
