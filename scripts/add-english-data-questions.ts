import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
const sql = neon(process.env.DATABASE_URL!);

// English Data-related Interview Questions for Big Tech and Mid-size Companies
const englishDataQuestions = [
  // ===== Google - Data Analyst/Data Scientist =====
  {
    company: 'Google',
    position: 'Data Analyst',
    questionType: 'technical',
    difficulty: 'medium',
    question: 'Write a SQL query to find the top 3 most frequently searched queries for each country in the last 30 days. Include the query text, country, and search count.',
    recommendedAnswer: `WITH search_counts AS (
  SELECT 
    country,
    query_text,
    COUNT(*) AS search_count,
    ROW_NUMBER() OVER (PARTITION BY country ORDER BY COUNT(*) DESC) AS rn
  FROM search_logs
  WHERE search_date >= CURRENT_DATE - INTERVAL '30 days'
  GROUP BY country, query_text
)
SELECT 
  country,
  query_text,
  search_count
FROM search_counts
WHERE rn <= 3
ORDER BY country, search_count DESC;`,
    tags: 'SQL,window functions,analytics',
    source: 'Glassdoor',
    year: 2024,
    isVerified: true
  },
  {
    company: 'Google',
    position: 'Data Scientist',
    questionType: 'stats',
    difficulty: 'hard',
    question: 'How would you design an A/B test to measure the impact of a new search ranking algorithm? What metrics would you track, and how would you ensure statistical significance?',
    recommendedAnswer: `Key considerations for designing the A/B test:

1. **Hypothesis Definition**
   - Null hypothesis: New algorithm has no effect on user engagement
   - Alternative hypothesis: New algorithm improves user engagement

2. **Metrics Selection**
   - Primary metric: Click-through rate (CTR) on first result
   - Secondary metrics: Time to successful search, bounce rate, search refinement rate
   - Guardrail metrics: Page load time, revenue per search

3. **Sample Size Calculation**
   - Use power analysis (typically 80% power, 5% significance level)
   - Assume baseline CTR of 30%, detect 2% absolute improvement
   - Required sample size ≈ 10,000 users per group

4. **Randomization Strategy**
   - Use consistent hashing on user_id for stable assignment
   - 50/50 split between control and treatment
   - Consider stratification by user segment (new vs. returning)

5. **Duration**
   - Run for at least 2 weeks to account for day-of-week effects
   - Monitor for novelty effects and seasonality

6. **Statistical Analysis**
   - Use two-sample t-test or z-test for CTR comparison
   - Calculate confidence intervals
   - Check for Simpson's paradox in segmented analysis
   - Use sequential testing if early stopping is needed`,
    tags: 'A/B testing,statistics,experimental design',
    source: 'Interview Experience',
    year: 2024,
    isVerified: true
  },
  {
    company: 'Google',
    position: 'Data Scientist',
    questionType: 'behavioral',
    difficulty: 'medium',
    question: 'Tell me about a time when your data analysis led to a surprising or counterintuitive insight. How did you communicate this to stakeholders who might have been skeptical?',
    recommendedAnswer: `STAR Format Response:

**Situation**: At my previous company, we noticed declining user retention rates despite increasing feature usage.

**Task**: I was tasked with investigating why active users were churning at higher rates than before.

**Action**:
- Conducted cohort analysis and discovered that power users (top 10% by activity) had 30% higher churn than moderate users
- Found that feature overload was causing decision fatigue
- Created visualizations showing the inverted U-curve relationship between feature usage and retention
- Presented findings to skeptical product team with three key points:
  1. Data evidence with confidence intervals
  2. User interview quotes supporting the quantitative findings
  3. A/B test proposal to validate the hypothesis

**Result**:
- Convinced team to implement a simplified onboarding flow
- Ran controlled experiment showing 15% improvement in 30-day retention
- Result was rolled out company-wide and became a case study for product decisions

**Key Takeaways**:
- Always validate counterintuitive findings with multiple data sources
- Use storytelling and visualization to make complex insights accessible
- Propose actionable experiments to turn skeptics into believers`,
    tags: 'communication,data storytelling,stakeholder management',
    source: 'Blind',
    year: 2024,
    isVerified: true
  },

  // ===== Meta (Facebook) =====
  {
    company: 'Meta',
    position: 'Data Engineer',
    questionType: 'technical',
    difficulty: 'hard',
    question: 'Design a Python solution to process a stream of user events (millions per second) and calculate real-time engagement metrics with exactly-once semantics. Handle late-arriving data.',
    recommendedAnswer: `from collections import defaultdict, deque
from datetime import datetime, timedelta
import threading
import time

class RealTimeEngagementProcessor:
    """
    Process streaming events with watermarking for late data handling
    """
    def __init__(self, watermark_delay_seconds=300):  # 5 min watermark
        self.watermark_delay = timedelta(seconds=watermark_delay_seconds)
        self.engagement_windows = defaultdict(lambda: {
            'views': 0,
            'clicks': 0,
            'shares': 0,
            'event_ids': set()  # For exactly-once processing
        })
        self.late_events_buffer = deque(maxlen=10000)
        self.current_watermark = None
        self.lock = threading.Lock()
    
    def process_event(self, event):
        """
        Process a single event with exactly-once guarantee
        event = {
            'event_id': str,
            'user_id': str,
            'event_type': 'view' | 'click' | 'share',
            'timestamp': datetime,
            'content_id': str
        }
        """
        event_time = event['timestamp']
        event_id = event['event_id']
        
        with self.lock:
            # Update watermark
            if self.current_watermark is None:
                self.current_watermark = event_time - self.watermark_delay
            else:
                self.current_watermark = max(
                    self.current_watermark,
                    event_time - self.watermark_delay
                )
            
            # Check if event is too late (beyond watermark)
            if event_time < self.current_watermark:
                self.late_events_buffer.append(event)
                return {'status': 'late', 'event_id': event_id}
            
            # Get minute-level window key
            window_key = event_time.replace(second=0, microsecond=0)
            window_data = self.engagement_windows[window_key]
            
            # Exactly-once check
            if event_id in window_data['event_ids']:
                return {'status': 'duplicate', 'event_id': event_id}
            
            # Process event
            window_data['event_ids'].add(event_id)
            event_type = event['event_type']
            if event_type in window_data:
                window_data[event_type] += 1
            
            return {'status': 'processed', 'event_id': event_id, 'window': window_key}
    
    def get_metrics(self, start_time, end_time):
        """Get engagement metrics for a time range"""
        with self.lock:
            metrics = {
                'total_views': 0,
                'total_clicks': 0,
                'total_shares': 0,
                'ctr': 0.0,
                'share_rate': 0.0
            }
            
            current = start_time.replace(second=0, microsecond=0)
            while current <= end_time:
                window_data = self.engagement_windows.get(current, {})
                metrics['total_views'] += window_data.get('views', 0)
                metrics['total_clicks'] += window_data.get('clicks', 0)
                metrics['total_shares'] += window_data.get('shares', 0)
                current += timedelta(minutes=1)
            
            # Calculate rates
            if metrics['total_views'] > 0:
                metrics['ctr'] = metrics['total_clicks'] / metrics['total_views']
                metrics['share_rate'] = metrics['total_shares'] / metrics['total_views']
            
            return metrics
    
    def cleanup_old_windows(self, retention_hours=24):
        """Clean up old window data to prevent memory growth"""
        with self.lock:
            cutoff = datetime.now() - timedelta(hours=retention_hours)
            keys_to_delete = [
                k for k in self.engagement_windows.keys() 
                if k < cutoff
            ]
            for key in keys_to_delete:
                del self.engagement_windows[key]

# Usage example
processor = RealTimeEngagementProcessor(watermark_delay_seconds=300)

# Simulate event processing
events = [
    {'event_id': '1', 'user_id': 'u1', 'event_type': 'view', 
     'timestamp': datetime.now(), 'content_id': 'c1'},
    {'event_id': '2', 'user_id': 'u1', 'event_type': 'click',
     'timestamp': datetime.now(), 'content_id': 'c1'},
]

for event in events:
    result = processor.process_event(event)
    print(f"Processed: {result}")`,
    tags: 'Python,streaming,real-time,data engineering',
    source: 'LeetCode',
    year: 2024,
    isVerified: true
  },
  {
    company: 'Meta',
    position: 'Data Scientist',
    questionType: 'case_study',
    difficulty: 'hard',
    question: 'Instagram Reels engagement dropped 15% last week. Walk me through your investigation process and how you would identify the root cause.',
    recommendedAnswer: `**Structured Investigation Approach:**

**1. Clarify the Metric (2 mins)**
- Which engagement metric? (views, likes, comments, shares, watch time?)
- What definition of "dropped"? (Absolute? Relative to trend?)
- Which geography/platform? (iOS, Android, Web?)
- Which user segments? (New vs. returning, age groups?)

**2. Check for Data Quality Issues (5 mins)**
- Logging changes: Was there a code deployment?
- Data pipeline delays: Are we missing recent data?
- Definition changes: Did the metric calculation change?
- A/B tests: Are we in a learning phase of an experiment?

**3. Segment the Problem (10 mins)**
- **Time dimension**: When exactly did it start? (Specific day/hour?)
- **Geographic**: Is it global or specific regions?
- **Platform**: iOS, Android, or both?
- **User cohorts**: 
  * New users vs. power users
  * Age demographics
  * Content creators vs. consumers
- **Content types**: Certain categories affected more?

**4. Form Hypotheses (5 mins)**
Ordered by likelihood:
1. **Algorithm change**: Reels ranking algorithm updated
2. **Content supply shock**: Top creators on vacation/stopped posting
3. **Product change**: UI/UX change made Reels harder to discover
4. **External factors**: Competitor launched similar feature
5. **Seasonal effect**: Holiday week with different behavior
6. **Technical issue**: Bug affecting certain devices

**5. Validate Top Hypotheses (15 mins)**

**For Algorithm Change:**
- Check deployment logs for ranking model updates
- Compare distribution of Reels shown per user before/after
- Analyze content diversity metrics

**For Content Supply:**
\`\`\`sql
-- Check creator posting frequency
SELECT 
  DATE_TRUNC('day', post_date) AS day,
  COUNT(DISTINCT creator_id) AS active_creators,
  COUNT(*) AS total_posts,
  AVG(video_length) AS avg_length
FROM reels_posts
WHERE post_date >= CURRENT_DATE - 14
GROUP BY 1
ORDER BY 1;
\`\`\`

**For Product Change:**
- Review recent A/B test results
- Check funnel metrics: Home → Reels tab → Video view
- Analyze error logs for crashes/bugs

**6. Quantify Impact (5 mins)**
- Size of affected user base
- Revenue impact (if applicable)
- Expected recovery timeline

**7. Recommend Actions (3 mins)**
- **Immediate**: Rollback if product bug identified
- **Short-term**: Manual content curation to boost quality
- **Long-term**: Improve recommendation algorithm with new signals

**Example Finding Structure:**
"The 15% drop in Reels engagement was driven by a 25% decrease in video completion rate specifically on Android devices in the US, starting Tuesday at 2 PM. Root cause analysis revealed a bug in the latest app version (v123.0) causing videos to buffer excessively. Recommendation: Immediate rollback to v122.0 for Android users."`,
    tags: 'root cause analysis,product analytics,metrics',
    source: 'Glassdoor',
    year: 2024,
    isVerified: true
  },

  // ===== Amazon =====
  {
    company: 'Amazon',
    position: 'Business Intelligence Engineer',
    questionType: 'technical',
    difficulty: 'medium',
    question: 'Write a SQL query to identify customers who made a purchase in Q1 2024 but not in Q2 2024. Include customer_id, Q1 total spend, and number of Q1 orders.',
    recommendedAnswer: `WITH q1_customers AS (
  SELECT 
    customer_id,
    SUM(order_amount) AS q1_total_spend,
    COUNT(DISTINCT order_id) AS q1_order_count
  FROM orders
  WHERE order_date >= '2024-01-01' 
    AND order_date < '2024-04-01'
  GROUP BY customer_id
),
q2_customers AS (
  SELECT DISTINCT customer_id
  FROM orders
  WHERE order_date >= '2024-04-01' 
    AND order_date < '2024-07-01'
)
SELECT 
  q1.customer_id,
  q1.q1_total_spend,
  q1.q1_order_count
FROM q1_customers q1
LEFT JOIN q2_customers q2 ON q1.customer_id = q2.customer_id
WHERE q2.customer_id IS NULL
ORDER BY q1.q1_total_spend DESC;

-- Alternative using NOT EXISTS (more efficient for large datasets)
SELECT 
  customer_id,
  SUM(order_amount) AS q1_total_spend,
  COUNT(DISTINCT order_id) AS q1_order_count
FROM orders
WHERE order_date >= '2024-01-01' 
  AND order_date < '2024-04-01'
GROUP BY customer_id
HAVING NOT EXISTS (
  SELECT 1 
  FROM orders o2
  WHERE o2.customer_id = orders.customer_id
    AND o2.order_date >= '2024-04-01' 
    AND o2.order_date < '2024-07-01'
)
ORDER BY q1_total_spend DESC;`,
    tags: 'SQL,customer analytics,cohort analysis',
    source: 'LeetCode',
    year: 2024,
    isVerified: true
  },
  {
    company: 'Amazon',
    position: 'Data Scientist',
    questionType: 'stats',
    difficulty: 'medium',
    question: 'Explain the difference between Type I and Type II errors. In the context of Amazon\'s fraud detection system, which error is more costly and why?',
    recommendedAnswer: `**Type I and Type II Errors:**

**Type I Error (False Positive)**
- Rejecting a true null hypothesis
- In fraud detection: Flagging a legitimate transaction as fraudulent
- Also called: α (alpha) error

**Type II Error (False Negative)**
- Failing to reject a false null hypothesis
- In fraud detection: Missing a fraudulent transaction
- Also called: β (beta) error

**Visualization:**
\`\`\`
                Reality
          Fraud    Legit
Predict  ┌─────────────────┐
Fraud    │   ✓    │   FP   │ (Type I)
         │        │        │
Legit    │   FN   │   ✓    │ (Type II)
         └─────────────────┘
\`\`\`

**Cost Analysis for Amazon:**

**Type I Error Costs (False Positive):**
- Customer frustration/declined purchase
- Lost revenue from blocked transaction
- Customer service costs
- Potential customer churn
- Estimated cost: $50-200 per incident

**Type II Error Costs (False Negative):**
- Direct financial loss (Amazon may cover fraud)
- Chargeback fees ($20-30 per case)
- Reputational damage
- Increased fraud patterns if undetected
- Estimated cost: $100-1000+ per incident

**Which is More Costly?**

For Amazon, **Type II errors (false negatives) are generally more costly** because:

1. **Direct Financial Loss**: Amazon often bears the cost of fraud through buyer protection programs
2. **Scalability**: One missed fraud pattern can lead to exploitation by organized fraud rings
3. **Regulatory Penalties**: Failing to detect fraud can result in fines

However, the optimal strategy is to **minimize total cost**, not just one error type:

**Total Cost = (Type I Error Rate × Type I Cost) + (Type II Error Rate × Type II Cost)**

**Amazon's Approach:**
- Use machine learning with tunable thresholds
- Multiple layers: rule-based + ML model + manual review
- Different thresholds for different transaction amounts:
  * Low-value: Higher tolerance for Type I (let more through)
  * High-value: Lower tolerance for Type II (flag aggressively)
- Monitor precision-recall tradeoff continuously

**Example Threshold Decision:**
If model outputs fraud probability:
- p > 0.9: Auto-decline (high confidence fraud)
- 0.3 < p < 0.9: Manual review queue
- p < 0.3: Auto-approve

This minimizes Type II errors for clear fraud cases while reducing Type I errors for borderline cases through human review.`,
    tags: 'statistics,hypothesis testing,fraud detection',
    source: 'Glassdoor',
    year: 2024,
    isVerified: true
  },

  // ===== Microsoft =====
  {
    company: 'Microsoft',
    position: 'Data & Applied Scientist',
    questionType: 'technical',
    difficulty: 'hard',
    question: 'Design a recommendation system for Microsoft Teams to suggest relevant channels to users. Describe your approach, features, and evaluation metrics.',
    recommendedAnswer: `**Recommendation System Design for Teams Channel Suggestions**

**1. Problem Formulation**
- Goal: Recommend top 5 channels for each user to join
- Constraint: Real-time recommendations (< 100ms latency)
- Cold start: Handle new users and new channels

**2. Feature Engineering**

**User Features:**
- Demographics: role, department, tenure
- Activity: messages sent, meetings attended, files shared
- Current channels: number, categories, activity level
- Collaboration graph: colleagues' channel memberships
- Temporal: active hours, timezone

**Channel Features:**
- Metadata: name, description, category, creation date
- Activity: message frequency, member count, growth rate
- Content: topics (via NLP on messages), file types shared
- Engagement: avg messages per member, response time

**Interaction Features:**
- Implicit feedback: channel views, search queries
- Explicit feedback: joined/left channels
- Temporal patterns: when users join similar channels

**3. Model Architecture**

**Hybrid Approach:**

a) **Collaborative Filtering (Matrix Factorization)**
\`\`\`python
# User-Channel Interaction Matrix
# Use implicit feedback (views, joins)
from implicit.als import AlternatingLeastSquares

model = AlternatingLeastSquares(
    factors=128,
    regularization=0.01,
    iterations=50
)
model.fit(user_channel_matrix)
\`\`\`

b) **Content-Based Filtering**
\`\`\`python
# Channel embeddings from description + messages
from sentence_transformers import SentenceTransformer

encoder = SentenceTransformer('all-MiniLM-L6-v2')
channel_embeddings = encoder.encode(channel_descriptions)

# User profile: weighted average of joined channels
user_profile = weighted_avg(user_channels_embeddings)

# Similarity
similarity = cosine_similarity(user_profile, channel_embeddings)
\`\`\`

c) **Graph-Based (Network Effects)**
\`\`\`python
# PageRank-style algorithm
# Channels are important if connected users are active
import networkx as nx

G = nx.DiGraph()
# Nodes: users + channels
# Edges: user-channel memberships weighted by activity

scores = nx.pagerank(G, personalization=user_vector)
\`\`\`

d) **Gradient Boosting (Final Ranking)**
\`\`\`python
import lightgbm as lgb

features = [
    'cf_score',           # From collaborative filtering
    'content_similarity', # From content-based
    'graph_score',        # From network analysis
    'channel_growth_rate',
    'colleague_overlap',  # % of colleagues in channel
    'topic_match',        # User interest × channel topic
    'recency_score'       # Newer channels boosted
]

model = lgb.LGBMRanker(
    objective='lambdarank',
    metric='ndcg',
    n_estimators=100
)
model.fit(X_train, y_train, group=user_groups)
\`\`\`

**4. Cold Start Handling**

**New Users:**
- Use department-based rules
- Onboarding survey for interests
- Bootstrap with popular channels in their team

**New Channels:**
- Rely on content similarity
- Notify members of related channels
- Manual curation for important launches

**5. Evaluation Metrics**

**Offline Metrics:**
- NDCG@5: Ranking quality
- Hit Rate@5: Did user join any recommended channel?
- Coverage: % of channels that get recommended
- Diversity: Average dissimilarity among top-5

**Online Metrics (A/B Test):**
- Primary: Channel join rate (within 7 days)
- Secondary: 
  * User engagement in joined channels (messages sent)
  * Retention in recommended channels (30-day)
  * Time to first message after joining
- Guardrails:
  * Channel overload (don't recommend too many)
  * User notification fatigue

**6. Production Architecture**

\`\`\`
┌─────────────┐
│   Offline   │ Batch jobs (daily)
│   Training  │ → Update models
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│  Feature Store  │ Pre-computed features
│   (Redis)       │ + User/Channel embeddings
└────────┬────────┘
         │
         ▼
  ┌──────────────┐
  │   Serving    │ Real-time inference
  │   API        │ (<100ms latency)
  └──────────────┘
         │
         ▼
  ┌──────────────┐
  │  A/B Test    │ Online evaluation
  │  Framework   │ + Feedback loop
  └──────────────┘
\`\`\`

**7. Implementation Considerations**
- Personalization vs. Privacy: GDPR compliance
- Explainability: Show why channel was recommended
- Feedback loop: Track clicks, joins, and long-term engagement
- Continuous learning: Retrain weekly with new interaction data`,
    tags: 'recommendation system,machine learning,system design',
    source: 'Interview Experience',
    year: 2024,
    isVerified: true
  },

  // ===== Netflix =====
  {
    company: 'Netflix',
    position: 'Data Engineer',
    questionType: 'technical',
    difficulty: 'hard',
    question: 'How would you design a data pipeline to process 100 TB of viewing logs per day and generate real-time recommendations? Consider scalability, fault tolerance, and latency requirements.',
    recommendedAnswer: `**Data Pipeline Architecture for Netflix-Scale Recommendations**

**1. Requirements**
- Volume: 100 TB/day (≈1.2 GB/second)
- Latency: Real-time recommendations (<500ms P99)
- Scale: 200M+ users, 10K+ titles
- Reliability: 99.99% uptime

**2. Architecture Overview**

\`\`\`
[User Clients]
     │
     ▼
[Load Balancer] → [API Gateway]
     │                   │
     ▼                   ▼
[Kafka Cluster]    [Recommendation
   (Events)          Service]
     │                   │
     ├─────────┬─────────┴──────────┐
     ▼         ▼                    ▼
[Flink]   [Spark      [Feature Store]
(Real-   Streaming]   (Redis/Cassandra)
 time)    (Batch)           │
     │         │             │
     ▼         ▼             │
[Elasticsearch] [S3/HDFS]    │
(Analytics)    (Long-term)   │
                 │           │
                 ▼           │
            [Model Training] │
            (Spark MLlib)    │
                 │           │
                 └───────────┘
\`\`\`

**3. Detailed Components**

**a) Data Ingestion (Kafka)**
\`\`\`yaml
# Kafka Configuration
topics:
  viewing-events:
    partitions: 1000  # Parallel processing
    replication: 3
    retention: 7 days
    
event_schema:
  user_id: string
  content_id: string
  event_type: [play, pause, stop, complete, skip]
  timestamp: long
  duration_seconds: int
  device_type: string
  quality: string
\`\`\`

**b) Stream Processing (Apache Flink)**
\`\`\`java
// Real-time feature computation
StreamExecutionEnvironment env = 
    StreamExecutionEnvironment.getExecutionEnvironment();

DataStream<ViewingEvent> events = env
    .addSource(new FlinkKafkaConsumer<>("viewing-events", schema, props))
    .assignTimestampsAndWatermarks(
        WatermarkStrategy.<ViewingEvent>forBoundedOutOfOrderness(
            Duration.ofMinutes(5)
        )
    );

// Compute real-time features
DataStream<UserFeatures> userFeatures = events
    .keyBy(ViewingEvent::getUserId)
    .window(TumblingEventTimeWindows.of(Time.minutes(5)))
    .aggregate(new UserFeatureAggregator())
    .name("real-time-user-features");

// Update feature store
userFeatures
    .addSink(new RedisSink<>(redisConfig))
    .name("update-feature-store");

// Send to recommendation engine
userFeatures
    .addSink(new RecommendationTriggerSink())
    .name("trigger-recommendations");
\`\`\`

**c) Batch Processing (Spark)**
\`\`\`python
# Daily batch job for model training
from pyspark.sql import SparkSession
from pyspark.ml.recommendation import ALS

spark = SparkSession.builder \\
    .appName("NetflixRecommendations") \\
    .config("spark.executor.memory", "32g") \\
    .config("spark.executor.cores", "8") \\
    .config("spark.dynamicAllocation.enabled", "true") \\
    .getOrCreate()

# Load viewing logs from S3
viewing_logs = spark.read.parquet("s3://netflix-logs/year=2024/month=11/")

# Feature engineering
user_item_interactions = viewing_logs \\
    .groupBy("user_id", "content_id") \\
    .agg(
        F.sum(F.when(F.col("event_type") == "complete", 1).otherwise(0)).alias("completions"),
        F.sum("duration_seconds").alias("total_watch_time"),
        F.max("timestamp").alias("last_watched")
    ) \\
    .withColumn("implicit_rating", 
        F.expr("completions * 5 + total_watch_time / 3600")
    )

# Train ALS model
als = ALS(
    maxIter=10,
    regParam=0.1,
    userCol="user_id_encoded",
    itemCol="content_id_encoded",
    ratingCol="implicit_rating",
    coldStartStrategy="drop",
    implicitPrefs=True,
    nonnegative=True
)

model = als.fit(user_item_interactions)

# Generate recommendations for all users
user_recs = model.recommendForAllUsers(50)

# Save to feature store
user_recs.write \\
    .format("org.apache.spark.sql.cassandra") \\
    .options(table="user_recommendations", keyspace="netflix") \\
    .mode("overwrite") \\
    .save()
\`\`\`

**d) Feature Store (Redis + Cassandra)**
\`\`\`python
# Redis for real-time features (hot data)
import redis
import json

redis_client = redis.Redis(
    host='redis-cluster.netflix.internal',
    port=6379,
    db=0,
    decode_responses=True
)

# Store user's recent viewing history (TTL 7 days)
def update_user_recent_views(user_id, content_id):
    key = f"user:{user_id}:recent_views"
    redis_client.lpush(key, content_id)
    redis_client.ltrim(key, 0, 49)  # Keep last 50
    redis_client.expire(key, 7 * 24 * 3600)

# Cassandra for batch features (warm data)
from cassandra.cluster import Cluster

cluster = Cluster(['cassandra-1', 'cassandra-2', 'cassandra-3'])
session = cluster.connect('netflix')

# Pre-computed recommendations
session.execute("""
    INSERT INTO user_recommendations 
    (user_id, content_ids, scores, computed_at)
    VALUES (%s, %s, %s, %s)
""", (user_id, content_ids, scores, datetime.now()))
\`\`\`

**e) Recommendation Service (Low Latency)**
\`\`\`python
# FastAPI service for real-time serving
from fastapi import FastAPI
import asyncio

app = FastAPI()

@app.get("/recommendations/{user_id}")
async def get_recommendations(user_id: str):
    # 1. Get pre-computed recs from Cassandra (50ms)
    batch_recs_task = asyncio.create_task(
        get_batch_recommendations(user_id)
    )
    
    # 2. Get real-time features from Redis (10ms)
    realtime_features_task = asyncio.create_task(
        get_realtime_features(user_id)
    )
    
    # 3. Wait for both
    batch_recs, realtime_features = await asyncio.gather(
        batch_recs_task,
        realtime_features_task
    )
    
    # 4. Re-rank based on real-time context (20ms)
    final_recs = rerank_with_context(
        batch_recs,
        realtime_features,
        current_time=datetime.now()
    )
    
    return {"recommendations": final_recs[:20]}
\`\`\`

**4. Fault Tolerance**

**Data Loss Prevention:**
- Kafka replication factor: 3
- S3 for long-term storage (immutable logs)
- Exactly-once semantics in Flink

**Service Resilience:**
- Multiple AZ deployment
- Circuit breakers for downstream services
- Graceful degradation (fall back to popular content)

**5. Monitoring & Alerting**

\`\`\`python
# Key metrics to monitor
metrics = {
    "data_ingestion": {
        "kafka_lag": "< 1 minute",
        "events_per_second": "1M+",
        "partition_skew": "< 10%"
    },
    "processing": {
        "flink_checkpoint_duration": "< 30s",
        "spark_job_duration": "< 4 hours",
        "data_quality_score": "> 99%"
    },
    "serving": {
        "api_p99_latency": "< 500ms",
        "cache_hit_rate": "> 95%",
        "recommendation_diversity": "> 0.7"
    }
}
\`\`\`

**6. Cost Optimization**

- Use spot instances for batch jobs (60% savings)
- Tiered storage: Hot (Redis) → Warm (Cassandra) → Cold (S3)
- Compression: Parquet with Snappy (3x reduction)
- Data partitioning: By date + user_id for efficient queries

**Estimated Infrastructure:**
- Kafka: 50 nodes (m5.2xlarge)
- Flink: 100 nodes (c5.4xlarge)
- Spark: 500 nodes (r5.4xlarge) for daily batch
- Redis: 20 nodes (r6g.4xlarge)
- Cassandra: 30 nodes (i3.4xlarge)

Total cost: ~$500K/month at AWS prices`,
    tags: 'data pipeline,real-time,scalability,system design',
    source: 'Interview Experience',
    year: 2024,
    isVerified: true
  },

  // ===== Mid-size Companies =====
  
  // Airbnb
  {
    company: 'Airbnb',
    position: 'Data Scientist',
    questionType: 'case_study',
    difficulty: 'medium',
    question: 'Airbnb wants to test a new "Flexible Dates" feature that shows users the cheapest dates to book within a month. How would you measure success?',
    recommendedAnswer: `**Success Metrics Framework for Flexible Dates Feature**

**1. North Star Metric**
- **Primary**: Booking conversion rate (% of searchers who book)
- Rationale: Directly measures if feature drives revenue

**2. Input Metrics (Leading Indicators)**

**Discovery & Engagement:**
- Feature visibility rate (% of users who see it)
- Click-through rate on flexible dates
- Time spent viewing flexible date options
- Number of date combinations explored

**Search Behavior:**
- Search refinement rate (before vs. after)
- Average number of searches per session
- Search-to-view ratio (listings viewed per search)

**3. Output Metrics (Business Impact)**

**Primary Outcomes:**
- Booking conversion rate
- Revenue per search
- Average booking value

**Secondary Outcomes:**
- Booking lead time (days between search and check-in)
- Length of stay (nights per booking)
- Guest satisfaction scores

**4. Guardrail Metrics (Prevent Negative Impact)**

**User Experience:**
- Page load time (feature shouldn't slow down search)
- Search abandonment rate
- Customer support tickets related to confusion

**Business Health:**
- Host acceptance rate (flexible dates shouldn't cause issues)
- Cancellation rate
- Repeat booking rate

**5. Segmentation Analysis**

Measure impact across:
- User segments: New vs. returning, business vs. leisure
- Geographic: Domestic vs. international
- Booking window: Last-minute vs. planned
- Price sensitivity: Budget vs. premium seekers

**6. A/B Test Design**

\`\`\`python
# Test setup
experiment = {
    "hypothesis": "Flexible dates will increase bookings by reducing search friction",
    "duration": "4 weeks",  # Capture weekly seasonality
    "split": "50/50",
    "units": "user_id (first-time cookie)",
    "sample_size": 100000,  # Power analysis for 2% lift detection
    
    "control": "Standard date picker",
    "treatment": "Flexible dates with price comparison"
}
\`\`\`

**7. Success Criteria**

**Must Have (Launch Blockers):**
- Booking conversion rate: +2% lift (statistically significant)
- No degradation in user experience metrics
- Feature engagement: >20% of treatment users interact

**Nice to Have:**
- Revenue per search: +5% lift
- Search efficiency: -10% in searches per booking
- Longer booking windows: +15% in lead time

**8. Analytics Dashboard**

\`\`\`sql
-- Key metrics query
WITH user_sessions AS (
  SELECT 
    user_id,
    session_id,
    experiment_variant,
    MAX(CASE WHEN event = 'view_flexible_dates' THEN 1 ELSE 0 END) AS used_flexible,
    MAX(CASE WHEN event = 'booking_confirmed' THEN 1 ELSE 0 END) AS converted,
    SUM(CASE WHEN event = 'listing_view' THEN 1 ELSE 0 END) AS listings_viewed,
    MAX(booking_value) AS booking_value
  FROM events
  WHERE experiment_id = 'flexible_dates_v1'
    AND session_date >= '2024-11-01'
  GROUP BY 1, 2, 3
)
SELECT 
  experiment_variant,
  COUNT(DISTINCT user_id) AS users,
  
  -- Engagement
  AVG(used_flexible) AS flexible_usage_rate,
  AVG(listings_viewed) AS avg_listings_per_session,
  
  -- Conversion
  AVG(converted) AS conversion_rate,
  AVG(CASE WHEN converted = 1 THEN booking_value END) AS avg_booking_value,
  
  -- Statistical significance
  (AVG(converted) - LAG(AVG(converted)) OVER (ORDER BY experiment_variant)) / 
    SQRT(VARIANCE(converted) / COUNT(*)) AS z_score
    
FROM user_sessions
GROUP BY experiment_variant
ORDER BY experiment_variant;
\`\`\`

**9. Post-Launch Monitoring (First 30 Days)**

**Week 1: Engagement**
- Are users discovering the feature?
- Any UX confusion signals?

**Week 2-3: Conversion Impact**
- Is booking rate improving?
- Any negative segments?

**Week 4: Long-term Effects**
- Guest satisfaction post-stay
- Host feedback
- Repeat usage

**10. Decision Framework**

\`\`\`
IF conversion_rate_lift > 2% AND p_value < 0.05:
    IF guardrail_metrics_healthy:
        → SHIP to 100%
    ELSE:
        → FIX issues, re-test
ELSE IF 0% < lift < 2%:
    → ITERATE on feature (add date flexibility to price)
ELSE:
    → KILL feature
\`\`\`

**Expected Outcome:**
Based on industry benchmarks, flexible pricing features typically drive 3-5% lift in conversion with 15-20% feature adoption. The key is ensuring users understand the value proposition without adding friction.`,
    tags: 'A/B testing,metrics,product analytics',
    source: 'Glassdoor',
    year: 2024,
    isVerified: true
  },

  // Uber
  {
    company: 'Uber',
    position: 'Data Analyst',
    questionType: 'technical',
    difficulty: 'medium',
    question: 'Calculate the week-over-week retention rate for riders. A rider is considered retained if they took at least one ride in the following week.',
    recommendedAnswer: `-- Week-over-week rider retention analysis

WITH weekly_riders AS (
  -- Get riders active in each week
  SELECT 
    rider_id,
    DATE_TRUNC('week', ride_timestamp) AS week_start,
    COUNT(DISTINCT ride_id) AS num_rides
  FROM rides
  WHERE ride_timestamp >= CURRENT_DATE - INTERVAL '8 weeks'
    AND ride_status = 'completed'
  GROUP BY 1, 2
),

retention_cohorts AS (
  -- Join current week with next week to check retention
  SELECT 
    w1.week_start AS cohort_week,
    w1.rider_id,
    w1.num_rides AS cohort_week_rides,
    CASE WHEN w2.rider_id IS NOT NULL THEN 1 ELSE 0 END AS retained,
    w2.num_rides AS next_week_rides
  FROM weekly_riders w1
  LEFT JOIN weekly_riders w2 
    ON w1.rider_id = w2.rider_id
    AND w2.week_start = w1.week_start + INTERVAL '1 week'
)

-- Calculate retention metrics by cohort week
SELECT 
  cohort_week,
  COUNT(DISTINCT rider_id) AS cohort_size,
  SUM(retained) AS retained_riders,
  ROUND(100.0 * SUM(retained) / COUNT(DISTINCT rider_id), 2) AS retention_rate,
  ROUND(AVG(cohort_week_rides), 2) AS avg_rides_in_cohort_week,
  ROUND(AVG(CASE WHEN retained = 1 THEN next_week_rides END), 2) AS avg_rides_when_retained
FROM retention_cohorts
GROUP BY cohort_week
ORDER BY cohort_week DESC;

-- Alternative: Calculate retention by rider segment
WITH weekly_riders AS (
  SELECT 
    r.rider_id,
    DATE_TRUNC('week', r.ride_timestamp) AS week_start,
    COUNT(DISTINCT r.ride_id) AS num_rides,
    -- Rider segments
    u.signup_date,
    u.city,
    CASE 
      WHEN COUNT(DISTINCT r.ride_id) >= 5 THEN 'power_user'
      WHEN COUNT(DISTINCT r.ride_id) >= 2 THEN 'regular'
      ELSE 'casual'
    END AS rider_type
  FROM rides r
  JOIN users u ON r.rider_id = u.user_id
  WHERE r.ride_timestamp >= CURRENT_DATE - INTERVAL '8 weeks'
    AND r.ride_status = 'completed'
  GROUP BY 1, 2, u.signup_date, u.city
),

retention_by_segment AS (
  SELECT 
    w1.week_start AS cohort_week,
    w1.rider_type,
    w1.city,
    COUNT(DISTINCT w1.rider_id) AS cohort_size,
    COUNT(DISTINCT w2.rider_id) AS retained_riders,
    ROUND(100.0 * COUNT(DISTINCT w2.rider_id) / COUNT(DISTINCT w1.rider_id), 2) AS retention_rate
  FROM weekly_riders w1
  LEFT JOIN weekly_riders w2 
    ON w1.rider_id = w2.rider_id
    AND w2.week_start = w1.week_start + INTERVAL '1 week'
  GROUP BY 1, 2, 3
)

SELECT 
  cohort_week,
  rider_type,
  city,
  cohort_size,
  retained_riders,
  retention_rate,
  -- Calculate retention index (vs. overall average)
  ROUND(retention_rate / AVG(retention_rate) OVER (PARTITION BY cohort_week) * 100, 0) AS retention_index
FROM retention_by_segment
WHERE cohort_size >= 100  -- Filter for statistical significance
ORDER BY cohort_week DESC, retention_rate DESC;`,
    tags: 'SQL,retention,cohort analysis',
    source: 'LeetCode',
    year: 2024,
    isVerified: true
  },

  // LinkedIn
  {
    company: 'LinkedIn',
    position: 'Data Scientist',
    questionType: 'stats',
    difficulty: 'medium',
    question: 'You ran an A/B test for 2 weeks and found that the new feature increased engagement by 5% with p-value = 0.08. Your manager wants to launch. What do you recommend?',
    recommendedAnswer: `**Recommendation: DO NOT LAUNCH YET - Need More Evidence**

**1. Statistical Significance Issue**

The p-value of 0.08 is above the standard threshold of 0.05, meaning:
- 8% chance the observed effect is due to random chance
- Not statistically significant at 95% confidence level
- Risk of Type I error (false positive) is too high

**2. Why P-value Matters**

\`\`\`
p = 0.08 means: "If there's truly no effect, we'd see a 5%+ lift 
                 8 times out of 100 just by chance"
\`\`\`

**3. Risk Analysis**

**If We Launch with p=0.08:**
- **Scenario A (92% probability)**: Feature truly works → Good outcome
- **Scenario B (8% probability)**: No real effect → Wasted engineering resources, possible negative long-term impact

**Cost Calculation:**
\`\`\`
Expected Cost = P(false positive) × Cost of wrong decision
              = 0.08 × (engineering + opportunity cost)
              = 0.08 × $500K = $40K expected loss
\`\`\`

**4. Additional Considerations**

**Red Flags:**
- Only 2 weeks of data (may miss weekly seasonality)
- 5% lift seems high - could indicate:
  * Novelty effect
  * Sample size too small
  * Outlier week (holiday, promotion, etc.)

**What to Check:**
\`\`\`sql
-- 1. Check sample size and power
SELECT 
  experiment_group,
  COUNT(DISTINCT user_id) AS sample_size,
  AVG(engaged) AS engagement_rate,
  STDDEV(engaged) AS std_dev
FROM experiment_results
GROUP BY experiment_group;

-- Calculate if we have adequate power (usually need 80%+)
-- n ≈ 16σ²/δ² where δ = minimum detectable effect
\`\`\`

**2. Segment analysis:**
- Is lift consistent across user types?
- Any segments with negative impact?
- Is effect driven by a few power users?

**3. Temporal stability:**
- Is effect consistent day-over-day?
- Any weekly patterns?

**5. Recommended Actions**

**Option A: Extend Test (Preferred)**
- Continue for 2 more weeks (total 4 weeks)
- Capture full monthly cycle
- Likely to reach p < 0.05 if effect is real
- Additional data will increase confidence

**Option B: Bayesian Analysis**
\`\`\`python
# Use Bayesian approach with prior beliefs
from scipy import stats

# Prior: Based on similar past experiments
prior_mean = 0.02  # Historical lift for similar features
prior_std = 0.01

# Posterior calculation
likelihood_mean = 0.05
likelihood_std = 0.02  # From experiment

posterior_mean = (prior_mean/prior_std**2 + likelihood_mean/likelihood_std**2) / \\
                 (1/prior_std**2 + 1/likelihood_std**2)

# Probability that true lift > 0
prob_positive = stats.norm.cdf(0, loc=posterior_mean, scale=posterior_std)
print(f"Probability of positive effect: {1 - prob_positive:.2%}")

# If > 95%, consider launching
\`\`\`

**Option C: Limited Rollout**
- Ship to 10% of users for 2 weeks
- Monitor for issues
- Gives more data while limiting risk
- Can pull back quickly if problems arise

**6. Communication to Manager**

*"While the 5% lift is promising, the p-value of 0.08 means there's an 8% chance this is a false positive. Given the cost of potentially launching an ineffective feature, I recommend either:*

*1) Extending the test 2 more weeks to gain certainty (low cost, high value)*
*2) Limited 10% rollout as a validation step*

*If the effect is real, 2 more weeks will likely push p-value below 0.05. If it's not real, we'll save significant engineering resources. Based on our sample size calculator, we're currently at 65% power - extending to 4 weeks gets us to 85% power."*

**7. When P=0.08 Might Be Acceptable**

Only consider launching if:
- Feature is easily reversible (feature flag)
- Downside risk is minimal
- Upside is enormous (10x impact)
- Multiple experiments showed similar directional effect
- Qualitative data strongly supports launch

**In most cases, patience pays off. Wait for cleaner evidence.**`,
    tags: 'statistics,A/B testing,hypothesis testing,decision making',
    source: 'Blind',
    year: 2024,
    isVerified: true
  },

  // Spotify
  {
    company: 'Spotify',
    position: 'Data Scientist',
    questionType: 'behavioral',
    difficulty: 'medium',
    question: 'Describe a situation where you had to make a data-driven decision with incomplete or ambiguous data. How did you handle the uncertainty?',
    recommendedAnswer: `**STAR Framework Response:**

**Situation:**
At my previous company (music streaming startup), we were deciding whether to invest $2M in licensing podcasts. We had limited data because:
- Podcast feature was only 6 months old
- Small user sample (5% beta users)
- Incomplete attribution data (users switching between music and podcasts)
- Industry benchmarks didn't match our user base

**Task:**
Make a go/no-go recommendation to leadership within 2 weeks, despite data gaps, with decision impacting annual budget.

**Action - Structured Approach to Uncertainty:**

**1. Quantify What We Know (60% of picture)**
\`\`\`python
# Clear metrics from beta users
- Podcast adoption rate: 18% of beta users
- Avg listening time: 45 min/week (vs. 12 hours music)
- Retention impact: +8% for podcast listeners (7-day retention)
- Churn reduction: -15% for users with 3+ podcast sessions
\`\`\`

**2. Identify Key Unknowns (40% gap)**
- Will beta behavior generalize to full population?
- Are podcast listeners incremental or cannibalizing music time?
- What's the competitor threat if we don't invest?

**3. Fill Gaps with Proxy Data**
- **Industry data**: Scraped public Spotify/Apple earnings calls → podcasts growing 40% YoY
- **Survey**: Ran quick 1000-person survey ($2K) asking: "Would you use Spotify more if we had podcasts?" → 32% said yes
- **Competitive analysis**: Checked user reviews of competitors mentioning podcasts → 15% of negative reviews cited lack of podcasts

**4. Model Scenarios (Monte Carlo Simulation)**
\`\`\`python
import numpy as np

def simulate_podcast_roi(n_sims=10000):
    results = []
    for _ in range(n_sims):
        # Sample uncertain parameters from distributions
        adoption_rate = np.random.uniform(0.15, 0.30)  # 15-30%
        retention_lift = np.random.uniform(0.05, 0.12)  # 5-12%
        churn_reduction = np.random.uniform(0.10, 0.20)
        
        # Calculate value
        retained_users = 10_000_000 * retention_lift
        ltv_per_user = 50  # $50 lifetime value
        annual_value = retained_users * ltv_per_user
        
        # ROI
        roi = (annual_value - 2_000_000) / 2_000_000
        results.append(roi)
    
    return results

rois = simulate_podcast_roi()
print(f"Expected ROI: {np.mean(rois):.1%}")
print(f"P(ROI > 0): {np.mean([r > 0 for r in rois]):.1%}")
print(f"P(ROI > 50%): {np.mean([r > 0.5 for r in rois]):.1%}")
\`\`\`

**Results:**
- Expected ROI: +85%
- P(positive ROI): 78%
- P(ROI > 50%): 62%

**5. Communicated Uncertainty Transparently**

Created a "confidence dashboard" for leadership:
\`\`\`
HIGH CONFIDENCE (>80%):
✓ Podcast users have better retention
✓ Market is growing rapidly
✓ Competitors investing heavily

MEDIUM CONFIDENCE (50-80%):
? Adoption rate will be 15-30%
? Incremental time vs. music substitution

LOW CONFIDENCE (<50%):
? Exact content licensing costs over 3 years
? User willingness to pay for premium podcasts
\`\`\`

**6. Recommended Decision with Guardrails**

**Recommendation**: GO, but with de-risking strategy:
- Start with $500K pilot (3-month exclusive deals)
- Set clear success criteria: >15% adoption, <10% music listening decline
- Kill-switch if metrics don't hit targets in Q1
- Phase 2 ($1.5M) contingent on pilot results

**Result:**

- Leadership approved pilot approach
- After 3 months: 22% adoption, +9% retention, only -2% music time
- Full investment approved
- Feature contributed to 12% reduction in annual churn (estimated $8M value)

**Key Learnings:**

**1. Framework for Uncertainty:**
- Separate known from unknown explicitly
- Use proxies creatively (surveys, public data, competitors)
- Quantify uncertainty with ranges/scenarios, not point estimates

**2. Communicate Risk:**
- Don't hide uncertainty - it builds trust
- Frame as "confidence levels" not "guesses"
- Show decision-making process, not just conclusion

**3. Iterate with Guardrails:**
- Pilot > bet the farm
- Build in checkpoints for course correction
- Make decisions reversible when possible

**4. Document Assumptions:**
- Write down what you believed and why
- Review post-launch to improve future decisions
- Learn from both hits and misses

**Biggest Insight:**
Perfect data is rare. Better to make a good decision with 60% of the data and move fast than wait for 100% certainty and miss the opportunity. The key is structuring the decision to limit downside while preserving upside.`,
    tags: 'decision making,uncertainty,risk management,communication',
    source: 'Interview Experience',
    year: 2024,
    isVerified: true
  },

  // Stripe
  {
    company: 'Stripe',
    position: 'Data Scientist',
    questionType: 'technical',
    difficulty: 'hard',
    question: 'Write a SQL query to detect potential credit card fraud patterns: transactions that are significantly higher than a user\'s typical spending in a short time window.',
    recommendedAnswer: `-- Credit card fraud detection using statistical anomaly detection

WITH user_baseline AS (
  -- Calculate baseline spending patterns (last 90 days, excluding last 7 days)
  SELECT 
    user_id,
    COUNT(*) AS historical_tx_count,
    AVG(amount) AS avg_amount,
    STDDEV(amount) AS stddev_amount,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY amount) AS median_amount,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY amount) AS p95_amount,
    MAX(amount) AS max_amount,
    -- Time-based patterns
    AVG(EXTRACT(HOUR FROM transaction_time)) AS typical_hour,
    MODE() WITHIN GROUP (ORDER BY merchant_category) AS typical_category,
    COUNT(DISTINCT merchant_id) AS typical_merchant_diversity
  FROM transactions
  WHERE transaction_time >= CURRENT_TIMESTAMP - INTERVAL '90 days'
    AND transaction_time < CURRENT_TIMESTAMP - INTERVAL '7 days'
    AND status = 'completed'
  GROUP BY user_id
  HAVING COUNT(*) >= 10  -- Need sufficient history
),

recent_transactions AS (
  -- Recent transactions (last 7 days) to check for anomalies
  SELECT 
    t.transaction_id,
    t.user_id,
    t.amount,
    t.transaction_time,
    t.merchant_id,
    t.merchant_category,
    t.merchant_country,
    u.country AS user_country,
    
    -- Calculate time since last transaction
    t.transaction_time - LAG(t.transaction_time) OVER (
      PARTITION BY t.user_id ORDER BY t.transaction_time
    ) AS time_since_last_tx,
    
    -- Count recent transactions in short windows
    COUNT(*) OVER (
      PARTITION BY t.user_id 
      ORDER BY t.transaction_time 
      RANGE BETWEEN INTERVAL '1 hour' PRECEDING AND CURRENT ROW
    ) AS tx_count_last_hour,
    
    COUNT(*) OVER (
      PARTITION BY t.user_id 
      ORDER BY t.transaction_time 
      RANGE BETWEEN INTERVAL '24 hours' PRECEDING AND CURRENT ROW
    ) AS tx_count_last_24h,
    
    -- Sum of amounts in recent windows
    SUM(t.amount) OVER (
      PARTITION BY t.user_id 
      ORDER BY t.transaction_time 
      RANGE BETWEEN INTERVAL '1 hour' PRECEDING AND CURRENT ROW
    ) AS amount_last_hour,
    
    SUM(t.amount) OVER (
      PARTITION BY t.user_id 
      ORDER BY t.transaction_time 
      RANGE BETWEEN INTERVAL '24 hours' PRECEDING AND CURRENT ROW
    ) AS amount_last_24h
    
  FROM transactions t
  JOIN users u ON t.user_id = u.id
  WHERE t.transaction_time >= CURRENT_TIMESTAMP - INTERVAL '7 days'
    AND t.status = 'completed'
),

fraud_signals AS (
  -- Calculate fraud risk signals
  SELECT 
    rt.transaction_id,
    rt.user_id,
    rt.amount,
    rt.transaction_time,
    rt.merchant_category,
    
    -- Signal 1: Amount is unusually high (>3 standard deviations)
    CASE 
      WHEN rt.amount > ub.avg_amount + 3 * ub.stddev_amount THEN 1 
      ELSE 0 
    END AS signal_high_amount,
    
    -- Signal 2: Amount exceeds historical maximum
    CASE 
      WHEN rt.amount > ub.max_amount * 1.5 THEN 1 
      ELSE 0 
    END AS signal_exceeds_max,
    
    -- Signal 3: Rapid succession of transactions
    CASE 
      WHEN rt.tx_count_last_hour >= 5 THEN 1 
      ELSE 0 
    END AS signal_rapid_txs,
    
    -- Signal 4: High spending in 24h window
    CASE 
      WHEN rt.amount_last_24h > ub.avg_amount * 10 THEN 1 
      ELSE 0 
    END AS signal_spending_spike,
    
    -- Signal 5: Unusual merchant category
    CASE 
      WHEN rt.merchant_category != ub.typical_category 
           AND rt.amount > ub.p95_amount THEN 1 
      ELSE 0 
    END AS signal_unusual_category,
    
    -- Signal 6: Geographic anomaly
    CASE 
      WHEN rt.merchant_country != rt.user_country 
           AND rt.amount > ub.median_amount THEN 1 
      ELSE 0 
    END AS signal_foreign_transaction,
    
    -- Signal 7: Transaction at unusual time
    CASE 
      WHEN ABS(EXTRACT(HOUR FROM rt.transaction_time) - ub.typical_hour) > 6 
           AND rt.amount > ub.p95_amount THEN 1 
      ELSE 0 
    END AS signal_unusual_time,
    
    -- Baseline stats for context
    ub.avg_amount AS user_avg_amount,
    ub.stddev_amount AS user_stddev_amount,
    ub.p95_amount AS user_p95_amount,
    
    -- Z-score for amount
    ROUND(
      (rt.amount - ub.avg_amount) / NULLIF(ub.stddev_amount, 0),
      2
    ) AS amount_z_score
    
  FROM recent_transactions rt
  JOIN user_baseline ub ON rt.user_id = ub.user_id
),

fraud_scores AS (
  -- Aggregate fraud signals into risk score
  SELECT 
    *,
    (signal_high_amount * 3 +           -- Highest weight
     signal_exceeds_max * 3 +
     signal_rapid_txs * 2 +
     signal_spending_spike * 2 +
     signal_unusual_category * 1 +
     signal_foreign_transaction * 2 +
     signal_unusual_time * 1) AS fraud_risk_score
  FROM fraud_signals
)

-- Final output: High-risk transactions
SELECT 
  transaction_id,
  user_id,
  amount,
  transaction_time,
  merchant_category,
  fraud_risk_score,
  amount_z_score,
  
  -- Which signals were triggered
  CASE WHEN signal_high_amount = 1 THEN 'HIGH_AMOUNT ' ELSE '' END ||
  CASE WHEN signal_exceeds_max = 1 THEN 'EXCEEDS_MAX ' ELSE '' END ||
  CASE WHEN signal_rapid_txs = 1 THEN 'RAPID_TXS ' ELSE '' END ||
  CASE WHEN signal_spending_spike = 1 THEN 'SPENDING_SPIKE ' ELSE '' END ||
  CASE WHEN signal_unusual_category = 1 THEN 'UNUSUAL_CATEGORY ' ELSE '' END ||
  CASE WHEN signal_foreign_transaction = 1 THEN 'FOREIGN ' ELSE '' END ||
  CASE WHEN signal_unusual_time = 1 THEN 'UNUSUAL_TIME' ELSE '' END AS triggered_signals,
  
  user_avg_amount,
  user_p95_amount,
  
  -- Action recommendation
  CASE 
    WHEN fraud_risk_score >= 8 THEN 'BLOCK - High Risk'
    WHEN fraud_risk_score >= 5 THEN 'REVIEW - Medium Risk'
    WHEN fraud_risk_score >= 3 THEN 'MONITOR - Low Risk'
    ELSE 'ALLOW - Normal'
  END AS recommended_action
  
FROM fraud_scores
WHERE fraud_risk_score >= 3  -- Only return potential fraud
ORDER BY fraud_risk_score DESC, amount DESC
LIMIT 1000;

-- Additional query: Fraud pattern summary by user
SELECT 
  user_id,
  COUNT(*) AS flagged_transactions,
  SUM(amount) AS total_flagged_amount,
  AVG(fraud_risk_score) AS avg_risk_score,
  MAX(fraud_risk_score) AS max_risk_score,
  STRING_AGG(DISTINCT triggered_signals, ', ') AS common_patterns
FROM fraud_scores
WHERE fraud_risk_score >= 3
GROUP BY user_id
HAVING COUNT(*) >= 2  -- Multiple suspicious transactions
ORDER BY avg_risk_score DESC;`,
    tags: 'SQL,fraud detection,anomaly detection,window functions',
    source: 'LeetCode',
    year: 2024,
    isVerified: true
  },

  // DoorDash
  {
    company: 'DoorDash',
    position: 'Data Scientist',
    questionType: 'case_study',
    difficulty: 'medium',
    question: 'DoorDash noticed that restaurant partner churn increased by 20% last quarter. How would you investigate and what recommendations would you make?',
    recommendedAnswer: `**Restaurant Partner Churn Investigation Framework**

**1. Clarify the Problem (5 mins)**

**Questions to ask:**
- How is churn defined? (No orders for 30 days? Formal cancellation?)
- Which segments? (Cuisine type? City size? Partnership tier?)
- Is it voluntary churn or DoorDash-initiated?
- What's the baseline churn rate? (20% increase from what?)
- Timeline: Gradual or sudden increase?

**2. Form Initial Hypotheses (5 mins)**

**External Factors:**
- Competitor expansion (Uber Eats, Grubhub promotional wars)
- Economic downturn (restaurants closing)
- Regulatory changes (commission caps in certain cities)

**Internal Factors:**
- Commission structure changes
- Service quality decline (late deliveries, order accuracy)
- Product changes (algorithm favoring certain restaurants)
- Support responsiveness decreased

**Restaurant-Specific:**
- Low order volume (not worth the commission)
- Negative customer reviews
- Operational difficulties with platform

**3. Data Analysis Plan (30 mins)**

**A. Segment the Churn (Most Critical)**

\`\`\`sql
-- Churn analysis by segment
WITH restaurant_metrics AS (
  SELECT 
    restaurant_id,
    cuisine_type,
    city,
    partnership_start_date,
    DATEDIFF('day', partnership_start_date, CURRENT_DATE) AS tenure_days,
    tier,  -- Premium, Standard, Basic
    
    -- Performance metrics (last 90 days before churn)
    AVG(orders_per_day) AS avg_daily_orders,
    AVG(order_value) AS avg_order_value,
    AVG(customer_rating) AS avg_rating,
    AVG(prep_time_minutes) AS avg_prep_time,
    SUM(total_revenue) AS total_revenue,
    COUNT(DISTINCT customer_id) AS unique_customers,
    
    -- Calculate effective commission after promotions
    SUM(commission_paid) / SUM(total_revenue) AS effective_commission_rate,
    
    -- Quality metrics
    AVG(on_time_delivery_rate) AS on_time_rate,
    AVG(order_accuracy_rate) AS accuracy_rate,
    COUNT(support_tickets) AS support_ticket_count,
    
    -- Competition
    COUNT(nearby_restaurants) AS local_competition,
    
    -- Churn status
    CASE 
      WHEN last_order_date < CURRENT_DATE - 30 THEN 1 
      ELSE 0 
    END AS churned
    
  FROM restaurants r
  LEFT JOIN orders o USING (restaurant_id)
  LEFT JOIN support_tickets s USING (restaurant_id)
  GROUP BY restaurant_id, cuisine_type, city, tier, partnership_start_date
)

SELECT 
  cuisine_type,
  city,
  tier,
  COUNT(*) AS total_restaurants,
  SUM(churned) AS churned_count,
  ROUND(100.0 * SUM(churned) / COUNT(*), 2) AS churn_rate,
  
  -- Metrics for churned vs. retained
  AVG(CASE WHEN churned = 1 THEN avg_daily_orders END) AS churned_avg_orders,
  AVG(CASE WHEN churned = 0 THEN avg_daily_orders END) AS retained_avg_orders,
  
  AVG(CASE WHEN churned = 1 THEN avg_rating END) AS churned_avg_rating,
  AVG(CASE WHEN churned = 0 THEN avg_rating END) AS retained_avg_rating,
  
  AVG(CASE WHEN churned = 1 THEN support_ticket_count END) AS churned_tickets,
  AVG(CASE WHEN churned = 0 THEN support_ticket_count END) AS retained_tickets
  
FROM restaurant_metrics
GROUP BY 1, 2, 3
ORDER BY churn_rate DESC;
\`\`\`

**B. Timing Analysis**

\`\`\`sql
-- When did churn start increasing?
SELECT 
  DATE_TRUNC('week', churn_date) AS week,
  COUNT(*) AS churned_restaurants,
  AVG(tenure_days) AS avg_tenure_at_churn,
  STRING_AGG(DISTINCT churn_reason, ', ') AS common_reasons
FROM churned_restaurants
WHERE churn_date >= CURRENT_DATE - 180
GROUP BY 1
ORDER BY 1;
\`\`\`

**C. Cohort Analysis**

\`\`\`sql
-- Are newer partnerships churning faster?
SELECT 
  DATE_TRUNC('month', partnership_start_date) AS cohort_month,
  COUNT(*) AS cohort_size,
  SUM(CASE WHEN churned_within_90_days = 1 THEN 1 ELSE 0 END) AS early_churn,
  ROUND(100.0 * SUM(CASE WHEN churned_within_90_days = 1 THEN 1 ELSE 0 END) / COUNT(*), 2) AS churn_rate_90d
FROM restaurants
GROUP BY 1
ORDER BY 1 DESC;
\`\`\`

**D. Competitor Analysis**

- Check if churned restaurants appear on Uber Eats/Grubhub
- Compare commission rates publicly available
- Check for targeted competitor promotions

**4. Likely Findings (Example)**

**Discovered Root Causes:**

1. **Low Order Volume Segment (45% of churn)**
   - Restaurants with <5 orders/day churning at 35% vs. 8% baseline
   - Economics don't work: commission eats into thin margins
   
2. **Commission Rate Increase Impact (30% of churn)**
   - Q1 2024: DoorDash raised commission from 15% → 18% for basic tier
   - Basic tier churn increased from 12% → 28%
   
3. **Service Quality Issues (15% of churn)**
   - Late deliveries increased by 18% in certain markets
   - Dasher shortage during peak hours
   - Restaurants blamed by customers despite being ready
   
4. **Competitor Aggression (10% of churn)**
   - Uber Eats launched $0 commission for first 3 months in 5 major cities
   - 25% of churned restaurants in those cities switched

**5. Recommendations (Prioritized)**

**Immediate (Week 1-2):**

**A. Win-Back Campaign for Recent Churns**
- Offer: Reduced commission (12%) for 2 months if they return
- Target: High-value restaurants that churned in last 60 days
- Expected impact: Recover 15-20% of churned revenue

**B. Prevent At-Risk Churn**
\`\`\`python
# Build churn prediction model
features = [
    'avg_daily_orders',
    'order_trend_30d',  # Growing or declining?
    'customer_rating',
    'support_tickets_per_month',
    'commission_rate',
    'competitor_presence',
    'on_time_delivery_rate'
]

# Flag restaurants with >50% churn probability
# Proactive outreach by account managers
\`\`\`

**Short-term (Month 1-3):**

**C. Tiered Commission Structure**
- **High-volume tier (<100 orders/month)**: Lower to 12%
- **Medium tier (100-500)**: Keep at 15%
- **High-volume tier (>500)**: Negotiate custom rates

**D. Service Quality Improvement**
- Add 10% more Dashers in underserved zones
- Implement "restaurant ready" status to reduce blame for delays
- Faster support response (SLA: 2 hours → 30 minutes)

**E. Value-Add Services (Justify Commission)**
- Free marketing promotions for partners
- Better analytics dashboard showing customer insights
- Loyalty program integration

**Long-term (Quarter 2-4):**

**F. Marketplace Dynamics**
- Reduce oversaturation in high-competition areas
- Quality over quantity: Curate restaurant selection
- Help low-volume restaurants optimize menu for delivery

**G. Partnership Model Innovation**
- Introduce "self-delivery" option with lower commission
- Hybrid model: DoorDash marketing + restaurant delivery
- Revenue share instead of commission for key partners

**6. Success Metrics**

**Primary:**
- Restaurant churn rate: 20% → 12% within 2 quarters
- Gross order value (GOV) retained: +$50M annually

**Secondary:**
- Win-back rate: >15% of Q1 churned restaurants
- At-risk restaurant retention: >80%
- NPS from restaurant partners: +20 points

**Guardrails:**
- Don't sacrifice profitability: Monitor contribution margin
- Customer experience: Maintain restaurant quality ratings

**7. Estimated Impact**

\`\`\`
Current State:
- 10,000 partner restaurants
- 20% quarterly churn = 2,000 lost
- Avg revenue per restaurant = $5,000/month
- Quarterly loss = 2,000 × $5,000 × 3 = $30M

With Recommendations:
- Reduce churn to 12% = 1,200 lost
- Save 800 restaurants × $5,000 × 3 = $12M/quarter
- Win back 300 restaurants = $4.5M/quarter
- Total impact: $16.5M/quarter = $66M annually

Cost of interventions: ~$5M
Net benefit: $61M
ROI: 1,220%
\`\`\`

**8. Risk Mitigation**

- A/B test commission changes (50/50 split in pilot markets)
- Monitor for adverse selection (only low-quality restaurants stay)
- Ensure Dasher supply matches restaurant demand
- Regular check-ins with high-value partners

**Key Insight:**
Churn is rarely one cause - it's usually a combination. The framework is:
1. **Segment** to find patterns
2. **Quantify** each driver's contribution  
3. **Prioritize** interventions by impact × feasibility
4. **Test** before full rollout
5. **Monitor** continuously`,
    tags: 'churn analysis,root cause analysis,business strategy',
    source: 'Glassdoor',
    year: 2024,
    isVerified: true
  }
];

async function addEnglishDataQuestions() {
  console.log('🌍 Starting to add English data-related interview questions...\n');
  
  try {
    // Check current question count
    const currentCount = await sql`
      SELECT COUNT(*) as count FROM interview_questions
    `;
    
    console.log(`📊 Current total questions: ${currentCount[0].count}\n`);
    
    // Insert questions
    let successCount = 0;
    let skipCount = 0;
    
    for (let i = 0; i < englishDataQuestions.length; i++) {
      const q = englishDataQuestions[i];
      
      try {
        await sql`
          INSERT INTO interview_questions (
            company, position, question_type, difficulty, question, 
            recommended_answer, tags, source, year, is_verified
          ) VALUES (
            ${q.company}, ${q.position}, ${q.questionType}, ${q.difficulty}, 
            ${q.question}, ${q.recommendedAnswer}, ${q.tags}, ${q.source}, 
            ${q.year}, ${q.isVerified}
          )
        `;
        
        successCount++;
        console.log(`✅ [${i + 1}/${englishDataQuestions.length}] Added: ${q.company} - ${q.position}`);
        console.log(`   Type: ${q.questionType} | Difficulty: ${q.difficulty}`);
        console.log(`   Preview: ${q.question.substring(0, 80)}...\n`);
      } catch (error: any) {
        if (error.message && error.message.includes('duplicate')) {
          skipCount++;
          console.log(`⚠️  [${i + 1}/${englishDataQuestions.length}] Skipped (duplicate): ${q.company} - ${q.position}\n`);
        } else {
          console.error(`❌ Error inserting question ${i + 1}:`, error);
        }
      }
    }
    
    // Final statistics
    const newCount = await sql`
      SELECT COUNT(*) as count FROM interview_questions
    `;
    
    const typeDistribution = await sql`
      SELECT 
        question_type,
        COUNT(*) as count,
        ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) as percentage
      FROM interview_questions
      GROUP BY question_type
      ORDER BY count DESC
    `;
    
    const difficultyDistribution = await sql`
      SELECT 
        difficulty,
        COUNT(*) as count,
        ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) as percentage
      FROM interview_questions
      GROUP BY difficulty
      ORDER BY 
        CASE difficulty 
          WHEN 'easy' THEN 1 
          WHEN 'medium' THEN 2 
          WHEN 'hard' THEN 3 
        END
    `;
    
    const companyDistribution = await sql`
      SELECT 
        company,
        COUNT(*) as count
      FROM interview_questions
      WHERE company IN ('Google', 'Meta', 'Amazon', 'Microsoft', 'Netflix', 
                        'Airbnb', 'Uber', 'LinkedIn', 'Spotify', 'Stripe', 'DoorDash')
      GROUP BY company
      ORDER BY count DESC
    `;
    
    console.log('\n' + '='.repeat(60));
    console.log('📈 FINAL STATISTICS');
    console.log('='.repeat(60));
    console.log(`\n✅ Successfully added: ${successCount} questions`);
    console.log(`⚠️  Skipped (duplicates): ${skipCount} questions`);
    console.log(`📊 Total questions in database: ${newCount[0].count}`);
    console.log(`📈 Net increase: +${newCount[0].count - currentCount[0].count} questions\n`);
    
    console.log('📑 Question Type Distribution:');
    typeDistribution.forEach((row: any) => {
      console.log(`   ${row.question_type.padEnd(20)}: ${String(row.count).padStart(4)} (${row.percentage}%)`);
    });
    
    console.log('\n📊 Difficulty Distribution:');
    difficultyDistribution.forEach((row: any) => {
      console.log(`   ${row.difficulty.padEnd(20)}: ${String(row.count).padStart(4)} (${row.percentage}%)`);
    });
    
    console.log('\n🏢 Company Distribution (Top Companies):');
    companyDistribution.forEach((row: any) => {
      console.log(`   ${row.company.padEnd(20)}: ${String(row.count).padStart(4)} questions`);
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('✨ English data questions successfully added to the database!');
    console.log('='.repeat(60) + '\n');
    
  } catch (error) {
    console.error('❌ Error in main function:', error);
    throw error;
  }
}

// Run the script
addEnglishDataQuestions()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

