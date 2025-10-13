import 'dotenv/config';
import { emailService } from '@/lib/email-service';

async function main() {
  const args = process.argv.slice(2);
  const to = args[0] || process.env.TEST_RECIPIENT_EMAIL;
  const partnerName = args[1] || process.env.TEST_PARTNER_NAME || '匹配伙伴';
  const baseUrl = process.env.NEXTAUTH_URL || 'https://mockpals.com';
  const matchesUrl = `${baseUrl}/matches`;

  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY 未配置，请在环境变量或 .env.local 中设置。');
    process.exit(1);
  }
  if (!to) {
    console.error('请提供收件人邮箱：node scripts/send-match-success-email.ts test@example.com [partnerName]');
    process.exit(1);
  }

  console.log('准备发送匹配成功测试邮件...');
  console.log('收件人:', to);
  console.log('对方昵称:', partnerName);
  console.log('跳转链接:', matchesUrl);

  try {
    const res = await emailService.sendMatchSuccessEmail(to, {
      partnerName,
      matchesUrl,
    });
    console.log('发送结果:', res);
    console.log('✅ 测试邮件发送完成');
  } catch (err) {
    console.error('❌ 测试邮件发送失败:', err);
    process.exit(1);
  }
}

main();