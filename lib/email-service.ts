import { Resend } from 'resend';

// 单例模式：确保整个应用只有一个 Resend 实例
class EmailService {
  private static instance: EmailService;
  private resend: Resend;
  
  private constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }
  
  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }
  
  // 统一的邮件模板
  private getEmailTemplate(url: string, type: 'login' | 'password' = 'login'): string {
    const title = type === 'password' ? '设置密码' : '欢迎登录 MockPal';
    const buttonText = type === 'password' ? '设置密码' : '登录 MockPal';
    const description = type === 'password' 
      ? '点击下方按钮设置您的密码：' 
      : '点击下方按钮完成登录：';
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .button { display: inline-block; padding: 12px 24px; background: #3B82F6; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="color: #1f2937;">${title}</h1>
            </div>
            <p style="color: #4b5563;">${description}</p>
            <div style="text-align: center;">
              <a href="${url}" class="button">${buttonText}</a>
            </div>
            <p style="color: #6b7280; font-size: 14px;">如果按钮无法点击，请复制以下链接到浏览器：</p>
            <p style="color: #3b82f6; word-break: break-all; font-size: 14px;">${url}</p>
            <div class="footer">
              <p>此链接将在24小时后失效。</p>
              <p>如果您没有请求此邮件，请忽略。</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
  
  // 统一的邮件发送方法
  public async sendVerificationEmail(email: string, url: string) {
    console.log('🔵 [EmailService] 准备发送验证邮件');
    console.log('📧 收件人:', email);
    console.log('🔗 验证链接:', url);
    console.log('📮 发件人: MockPal <noreply@mockpals.com>');
    
    try {
      const emailPayload = {
        from: 'MockPal <noreply@mockpals.com>', // 使用自定义域名
        to: email,
        subject: 'MockPal - 登录验证',
        html: this.getEmailTemplate(url),
      };
      
      console.log('📤 发送邮件负载:', emailPayload);
      
      const result = await this.resend.emails.send(emailPayload);
      
      console.log('✅ [EmailService] 邮件发送成功!');
      console.log('📊 Resend 返回信息:', JSON.stringify(result, null, 2));
      console.log('📬 邮件ID:', result.data?.id);
      console.log('⏰ 发送时间:', new Date().toISOString());
      
      return result;
    } catch (error) {
      console.error('❌ [EmailService] 邮件发送失败!');
      console.error('🚫 错误详情:', error);
      if (error instanceof Error) {
        console.error('🔍 错误消息:', error.message);
        console.error('📋 错误堆栈:', error.stack);
      }
      throw error;
    }
  }
  
  // 发送设置密码邮件
  public async sendPasswordSetupEmail(email: string, url: string) {
    console.log('🔵 [EmailService] 准备发送设置密码邮件');
    console.log('📧 收件人:', email);
    console.log('🔗 设置密码链接:', url);
    
    try {
      const emailPayload = {
        from: 'MockPal <noreply@mockpals.com>',
        to: email,
        subject: 'MockPal - 设置密码',
        html: this.getEmailTemplate(url, 'password'),
      };
      
      console.log('📤 发送邮件负载:', emailPayload);
      
      const result = await this.resend.emails.send(emailPayload);
      
      console.log('✅ [EmailService] 设置密码邮件发送成功!');
      console.log('📬 邮件ID:', result.data?.id);
      
      return result;
    } catch (error) {
      console.error('❌ [EmailService] 设置密码邮件发送失败!');
      console.error('🚫 错误详情:', error);
      throw error;
    }
  }
}

// 导出单例实例
export const emailService = EmailService.getInstance();

// 为了保持向后兼容，同时导出发送函数
export async function sendVerificationRequest({ identifier: email, url }: { identifier: string; url: string }): Promise<void> {
  console.log('[NextAuth] sendVerificationRequest 被调用:', { email, url });
  try {
    await emailService.sendVerificationEmail(email, url);
    console.log('[NextAuth] 验证邮件发送完成');
  } catch (error) {
    console.error('[NextAuth] 验证邮件发送失败:', error);
    throw error;
  }
}