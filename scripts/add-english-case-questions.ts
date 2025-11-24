import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
const sql = neon(process.env.DATABASE_URL!);

const questions = [
  {
    company: 'Google',
    position: 'Data Scientist',
    questionType: 'case_study',
    difficulty: 'hard',
    question: 'YouTube mobile app daily active users dropped 8% in the past week. Walk me through your investigation process to identify the root cause.',
    recommendedAnswer: String.raw`Structured Investigation Framework:
1. Clarify the metric - Which DAU definition? Platform? Geography?
2. Data quality check - Logging issues or real problem?
3. Segment analysis - Platform, geography, user cohorts, content type
4. Form hypotheses - External factors, product changes, technical issues
5. Validate hypotheses with data queries and crash logs
6. Example finding: "8% drop driven by Android 13 users due to memory leak in v18.0"
7. Recommendations: Immediate rollback, hotfix, improve testing coverage`,
    tags: 'root cause analysis,DAU,mobile app,diagnostics',
    source: 'Glassdoor',
    year: 2024,
    isVerified: true
  },
  {
    company: 'Meta',
    position: 'Data Scientist',
    questionType: 'case_study',
    difficulty: 'hard',
    question: 'Facebook Groups adoption has plateaued for the past 3 months. How would you diagnose the problem and propose solutions to reignite growth?',
    recommendedAnswer: String.raw`Growth Diagnostic Framework:
1. Define "plateaued" - Which metric? New groups? Member joins? Engagement?
2. Analyze the funnel - Awareness → Discovery → Join → Activation → Retention
3. Segment analysis - By user type, group category, geography
4. Key findings: Discovery rate down 30%, spam reports up 45%, young adults shifting to Discord
5. Solutions: Improve group suggestions in News Feed, better moderation tools, real-time chat feature
6. Prioritize by impact vs effort matrix
7. Success metrics: MAGU growth resume 5% monthly, retention +8%`,
    tags: 'growth,product strategy,user engagement,funnel analysis',
    source: 'Blind',
    year: 2024,
    isVerified: true
  },
  {
    company: 'Uber',
    position: 'Data Scientist',
    questionType: 'case_study',
    difficulty: 'medium',
    question: 'Uber is considering surge pricing in a new city. How would you design an experiment to test its impact on rider and driver behavior?',
    recommendedAnswer: String.raw`Surge Pricing Experiment Design:
1. Define objectives - Reduce wait times by 20%, increase driver supply by 25%
2. Understand mechanism - High demand → Surge multiplier → More drivers → Lower wait times
3. Randomization - Geographic zone randomization (50/50 split)
4. Sample size - Power analysis: 40 zones per group, 4 weeks duration
5. Guardrails - Rider retention, cancellation rate, NPS
6. Analysis plan - T-test for wait times, heterogeneous treatment effects
7. Launch criteria - If wait time -15%+, driver supply +20%+, retention stable`,
    tags: 'A/B testing,pricing,marketplace,experimentation',
    source: 'LeetCode',
    year: 2024,
    isVerified: true
  },
  {
    company: 'Amazon',
    position: 'Data Scientist',
    questionType: 'case_study',
    difficulty: 'medium',
    question: 'Amazon is considering offering same-day delivery in a new city. What data and analysis would you need to determine if it is worth the investment?',
    recommendedAnswer: String.raw`Same-Day Delivery Feasibility Analysis:
1. Frame the problem - Should Amazon invest $16M for same-day delivery?
2. Data requirements - Market demographics, demand proxies, product categories
3. Cost analysis - Warehouse $6.5M, fleet $2M, operations $6.4M annually
4. Per-delivery economics - Cost $9.00, revenue $9.49, net profit $0.49/delivery
5. Demand estimation - Use comparable city analysis and ML model, predict 95K orders/year
6. Financial projections - 5-year NPV $5.2M, ROI 80%, payback 3 years
7. Recommendation - LAUNCH with phased approach (pilot → expand → full launch)`,
    tags: 'business case,ROI,financial modeling,operations',
    source: 'Glassdoor',
    year: 2024,
    isVerified: true
  },
  {
    company: 'Spotify',
    position: 'Data Scientist',
    questionType: 'case_study',
    difficulty: 'medium',
    question: 'Spotify Premium subscription cancellations increased 25% last month. How would you investigate the cause and develop an action plan?',
    recommendedAnswer: String.raw`Subscription Churn Investigation:
1. Clarify the metric - Which plan? Geography? Cohort? Baseline rate?
2. Immediate checks - Verify data quality, check recent changes
3. Segment analysis - By subscription type (60% from Student plan), tenure, geography
4. Root cause - Student verification process too strict, 75% churned when verification expired
5. Action plan: Win-back campaign ($4.99 for 3 months), fix Student plan grace period, build churn prediction model
6. Success metrics - Churn rate 5.0% → 3.5%, recover $5-8M in LTV
7. Timeline - Month 1: -20% churn, Month 3: back to baseline`,
    tags: 'churn analysis,subscription,retention,user lifecycle',
    source: 'Blind',
    year: 2024,
    isVerified: true
  },
  {
    company: 'Airbnb',
    position: 'Data Scientist',
    questionType: 'case_study',
    difficulty: 'hard',
    question: 'Airbnb is seeing a decline in host response rates to booking inquiries. Why might this be happening and what would you do about it?',
    recommendedAnswer: String.raw`Host Response Rate Investigation:
1. Define the problem - Response rate 85% → 75%, impacts guest experience and bookings
2. Segment analysis - Non-Superhosts with 4-10 listings most affected
3. Root causes: Inquiry volume up 40% (summer), low-quality spam inquiries, hosts overwhelmed
4. Solutions: Smart inquiry filters, improved notifications, quick reply templates, incentivize fast responses
5. AI auto-responses and instant book encouragement for low responders
6. Success metrics - Response rate 75% → 82%, conversion +8%, revenue +$8M annually
7. Timeline - Week 2: +3pp improvement, Month 2: stabilize at 82%`,
    tags: 'marketplace,host behavior,product intervention,two-sided platform',
    source: 'Glassdoor',
    year: 2024,
    isVerified: true
  }
];

async function addQuestions() {
  console.log('📚 Adding English case study questions...\n');
  
  try {
    const currentCount = await sql`SELECT COUNT(*) as count FROM interview_questions`;
    console.log(`📊 Current total questions: ${currentCount[0].count}\n`);
    
    let successCount = 0;
    
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      
      try {
        await sql`
          INSERT INTO interview_questions (
            company, position, question_type, difficulty, question, 
            recommended_answer, tags, source, year, is_verified, language
          ) VALUES (
            ${q.company}, ${q.position}, ${q.questionType}, ${q.difficulty}, 
            ${q.question}, ${q.recommendedAnswer}, ${q.tags}, ${q.source}, 
            ${q.year}, ${q.isVerified}, 'en'
          )
        `;
        
        successCount++;
        console.log(`✅ [${i + 1}/${questions.length}] Added: ${q.company} - ${q.position}`);
        console.log(`   ${q.question.substring(0, 70)}...\n`);
      } catch (error: any) {
        console.log(`⚠️  [${i + 1}/${questions.length}] Skipped: ${q.company}\n`);
      }
    }
    
    const newCount = await sql`SELECT COUNT(*) as count FROM interview_questions`;
    const enCaseCount = await sql`
      SELECT COUNT(*) as count 
      FROM interview_questions 
      WHERE language = 'en' AND question_type = 'case_study'
    `;
    
    console.log('\n' + '='.repeat(60));
    console.log('📈 FINAL STATISTICS');
    console.log('='.repeat(60));
    console.log(`\n✅ Successfully added: ${successCount} questions`);
    console.log(`📊 Total questions: ${newCount[0].count}`);
    console.log(`📚 English case studies: ${enCaseCount[0].count}`);
    console.log('\n✨ Done!\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

addQuestions()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
