import type { Match } from '@/lib/store';

// 生成微信好友申请模板（50字符以内）
export function generateWeChatFriendRequestTemplate(match: Match, currentUser: { username: string; jobType?: string; experienceLevel?: string }) {
  const practiceTypes = [];
  if (match.practicePreferences?.technicalInterview) practiceTypes.push('技术面');
  if (match.practicePreferences?.behavioralInterview) practiceTypes.push('行为面');
  if (match.practicePreferences?.caseAnalysis) practiceTypes.push('案例分析');
  
  const practiceText = practiceTypes.length > 0 ? practiceTypes.join('、') : '模拟面试';
  
  // 简洁版本，适合微信好友申请（50字符以内）
  return `MockPal ${practiceText}练习伙伴，一起进步！`;
}

// 生成微信联系模板（详细版本，用于聊天）
export function generateWeChatTemplate(match: Match, currentUser: { username: string; jobType?: string; experienceLevel?: string }) {
  const practiceTypes = [];
  if (match.practicePreferences?.technicalInterview) practiceTypes.push('技术面');
  if (match.practicePreferences?.behavioralInterview) practiceTypes.push('行为面');
  if (match.practicePreferences?.caseAnalysis) practiceTypes.push('案例分析');
  
  const practiceText = practiceTypes.length > 0 ? practiceTypes.join('、') : '模拟面试';
  
  return `你好！我是${currentUser.username}，在MockPal上看到你的资料，想和你一起练习${practiceText}。

我的背景：
- 岗位类型：${currentUser.jobType || '未设置'}
- 经验水平：${currentUser.experienceLevel || '未设置'}

看到你的目标公司是${match.targetCompany || '未设置'}，目标行业是${match.targetIndustry || '未设置'}，我们有很多共同点！

你什么时候方便进行模拟面试练习呢？建议30-60分钟，我们可以轮流扮演面试官和候选人。

期待和你一起进步！😊`;
}

// 生成LinkedIn联系模板
export function generateLinkedInTemplate(match: Match, currentUser: { username: string; jobType?: string; experienceLevel?: string }) {
  const practiceTypes = [];
  if (match.practicePreferences?.technicalInterview) practiceTypes.push('technical interviews');
  if (match.practicePreferences?.behavioralInterview) practiceTypes.push('behavioral interviews');
  if (match.practicePreferences?.caseAnalysis) practiceTypes.push('case analysis');
  
  const practiceText = practiceTypes.length > 0 ? practiceTypes.join(', ') : 'mock interviews';
  
  // Convert Chinese job types and experience levels to English
  const jobTypeMap: { [key: string]: string } = {
    'DA': 'Data Analytics',
    'DS': 'Data Science', 
    'DE': 'Data Engineering',
    'BA': 'Business Analytics'
  };
  
  const experienceMap: { [key: string]: string } = {
    '实习': 'Intern',
    '应届': 'New Graduate',
    '1-3年': '1-3 years',
    '3-5年': '3-5 years',
    '5年以上': '5+ years'
  };

  // Convert Chinese company names to English
  const companyMap: { [key: string]: string } = {
    'google': 'Google',
    'microsoft': 'Microsoft',
    'amazon': 'Amazon',
    'meta': 'Meta (Facebook)',
    'apple': 'Apple',
    'netflix': 'Netflix',
    'uber': 'Uber',
    'airbnb': 'Airbnb',
    'linkedin': 'LinkedIn',
    'twitter': 'Twitter',
    'salesforce': 'Salesforce',
    'oracle': 'Oracle',
    'ibm': 'IBM',
    'intel': 'Intel',
    'nvidia': 'NVIDIA',
    'amd': 'AMD',
    'cisco': 'Cisco',
    'adobe': 'Adobe',
    'spotify': 'Spotify',
    'slack': 'Slack',
    'zoom': 'Zoom',
    'palantir': 'Palantir',
    'databricks': 'Databricks',
    'snowflake': 'Snowflake',
    'mongodb': 'MongoDB',
    'elastic': 'Elastic',
    'splunk': 'Splunk',
    'tableau': 'Tableau',
    'alteryx': 'Alteryx',
    'other': 'Other'
  };

  // Convert Chinese industry names to English
  const industryMap: { [key: string]: string } = {
    'technology': 'Technology/Internet',
    'finance': 'Finance/Banking',
    'healthcare': 'Healthcare',
    'retail': 'Retail/E-commerce',
    'manufacturing': 'Manufacturing',
    'consulting': 'Consulting',
    'media': 'Media/Entertainment',
    'education': 'Education',
    'government': 'Government/Public Sector',
    'nonprofit': 'Non-profit',
    'energy': 'Energy',
    'transportation': 'Transportation',
    'real_estate': 'Real Estate',
    'insurance': 'Insurance',
    'telecommunications': 'Telecommunications',
    'automotive': 'Automotive',
    'aerospace': 'Aerospace',
    'pharmaceuticals': 'Pharmaceuticals',
    'biotechnology': 'Biotechnology',
    'other': 'Other'
  };
  
  const currentUserJobType = jobTypeMap[currentUser.jobType || ''] || currentUser.jobType || 'Not specified';
  const currentUserExperience = experienceMap[currentUser.experienceLevel || ''] || currentUser.experienceLevel || 'Not specified';
  const targetCompany = companyMap[match.targetCompany || ''] || match.targetCompany || 'Not specified';
  const targetIndustry = industryMap[match.targetIndustry || ''] || match.targetIndustry || 'Not specified';
  
  return `Hi ${match.username}! 👋

I'm ${currentUser.username}, and I found your profile on MockPal. I'd love to practice ${practiceText} together!

My background:
- Role: ${currentUserJobType}
- Experience: ${currentUserExperience}

I noticed you're targeting ${targetCompany} in the ${targetIndustry} industry - we seem to have similar goals!

Would you be interested in scheduling a 30-60 minute mock interview session? We can take turns being the interviewer and candidate.

Looking forward to connecting and helping each other grow! 🚀

Best regards,
${currentUser.username}`;
}

// 生成邮箱联系模板
export function generateEmailTemplate(match: Match, currentUser: { username: string; jobType?: string; experienceLevel?: string }) {
  const practiceTypes = [];
  if (match.practicePreferences?.technicalInterview) practiceTypes.push('technical interviews');
  if (match.practicePreferences?.behavioralInterview) practiceTypes.push('behavioral interviews');
  if (match.practicePreferences?.caseAnalysis) practiceTypes.push('case analysis');
  
  const practiceText = practiceTypes.length > 0 ? practiceTypes.join(', ') : 'mock interviews';
  
  // Convert Chinese job types and experience levels to English
  const jobTypeMap: { [key: string]: string } = {
    'DA': 'Data Analytics',
    'DS': 'Data Science', 
    'DE': 'Data Engineering',
    'BA': 'Business Analytics'
  };
  
  const experienceMap: { [key: string]: string } = {
    '实习': 'Intern',
    '应届': 'New Graduate',
    '1-3年': '1-3 years',
    '3-5年': '3-5 years',
    '5年以上': '5+ years'
  };

  // Convert Chinese company names to English
  const companyMap: { [key: string]: string } = {
    'google': 'Google',
    'microsoft': 'Microsoft',
    'amazon': 'Amazon',
    'meta': 'Meta (Facebook)',
    'apple': 'Apple',
    'netflix': 'Netflix',
    'uber': 'Uber',
    'airbnb': 'Airbnb',
    'linkedin': 'LinkedIn',
    'twitter': 'Twitter',
    'salesforce': 'Salesforce',
    'oracle': 'Oracle',
    'ibm': 'IBM',
    'intel': 'Intel',
    'nvidia': 'NVIDIA',
    'amd': 'AMD',
    'cisco': 'Cisco',
    'adobe': 'Adobe',
    'spotify': 'Spotify',
    'slack': 'Slack',
    'zoom': 'Zoom',
    'palantir': 'Palantir',
    'databricks': 'Databricks',
    'snowflake': 'Snowflake',
    'mongodb': 'MongoDB',
    'elastic': 'Elastic',
    'splunk': 'Splunk',
    'tableau': 'Tableau',
    'alteryx': 'Alteryx',
    'other': 'Other'
  };

  // Convert Chinese industry names to English
  const industryMap: { [key: string]: string } = {
    'technology': 'Technology/Internet',
    'finance': 'Finance/Banking',
    'healthcare': 'Healthcare',
    'retail': 'Retail/E-commerce',
    'manufacturing': 'Manufacturing',
    'consulting': 'Consulting',
    'media': 'Media/Entertainment',
    'education': 'Education',
    'government': 'Government/Public Sector',
    'nonprofit': 'Non-profit',
    'energy': 'Energy',
    'transportation': 'Transportation',
    'real_estate': 'Real Estate',
    'insurance': 'Insurance',
    'telecommunications': 'Telecommunications',
    'automotive': 'Automotive',
    'aerospace': 'Aerospace',
    'pharmaceuticals': 'Pharmaceuticals',
    'biotechnology': 'Biotechnology',
    'other': 'Other'
  };
  
  const currentUserJobType = jobTypeMap[currentUser.jobType || ''] || currentUser.jobType || 'Not specified';
  const currentUserExperience = experienceMap[currentUser.experienceLevel || ''] || currentUser.experienceLevel || 'Not specified';
  const targetCompany = companyMap[match.targetCompany || ''] || match.targetCompany || 'Not specified';
  const targetIndustry = industryMap[match.targetIndustry || ''] || match.targetIndustry || 'Not specified';
  
  return `Subject: MockPal - Mock Interview Practice Request

Dear ${match.username},

I hope this email finds you well. My name is ${currentUser.username}, and I found your profile on MockPal. I'm reaching out because I believe we could be great practice partners for ${practiceText}.

About me:
- Current role: ${currentUserJobType}
- Experience level: ${currentUserExperience}

I noticed you're targeting ${targetCompany} in the ${targetIndustry} industry, which aligns well with my career goals.

I would love to schedule a 30-60 minute mock interview session where we can take turns being the interviewer and candidate. This would be mutually beneficial for both of us to improve our interview skills.

Please let me know your availability and preferred time slots. I'm flexible and can accommodate different time zones if needed.

Looking forward to hearing from you and potentially working together!

Best regards,
${currentUser.username}

---
Sent via MockPal - Connecting interview practice partners`;
}

// 复制文本到剪贴板
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // 降级方案
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const result = document.execCommand('copy');
      textArea.remove();
      return result;
    }
  } catch (error) {
    console.error('Failed to copy text:', error);
    return false;
  }
} 