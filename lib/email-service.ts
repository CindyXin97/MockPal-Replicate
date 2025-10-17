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

  //匹配成功邮件模板
  public async sendMatchSuccessEmail(to: string, opts: { partnerName: string; matchesUrl: string }) {
    console.log('🔵 [EmailService] 准备发送匹配成功通知');
    console.log('📧 收件人:', to);
    console.log('👤 对方昵称:', opts.partnerName);
    console.log('🔗 跳转链接:', opts.matchesUrl);
  
    // 开发环境：直接打印，不真正发信
    if (process.env.NODE_ENV === 'development') {
      console.log('\n🚀 [开发环境] 匹配成功通知：');
      console.log(`🎉 你与 ${opts.partnerName} 匹配成功！前往查看：${opts.matchesUrl}\n`);
      return { data: { id: 'dev-mode-skip' }, error: null };
    }
  
    const isProduction = process.env.NODE_ENV === 'production';
    const fromEmail = isProduction 
      ? 'MockPal <noreply@mockpals.com>'
      : 'MockPal <onboarding@resend.dev>';
  
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .logo { text-align: center; background: #F3F4F6; padding: 24px 20px; margin: -20px -20px 20px -20px; }
            .logo img { max-width: 200px; height: auto; }
            .header { text-align: center; margin-bottom: 24px; }
            .button { display: inline-block; padding: 12px 20px; background: #3B82F6; color: white; text-decoration: none; border-radius: 8px; margin: 16px 0; }
            .tip { color: #6b7280; font-size: 14px; }
            .highlight-box { background: #F0F9FF; border-left: 4px solid #3B82F6; padding: 16px; margin: 20px 0; border-radius: 4px; }
            .highlight-text { color: #1E40AF; font-size: 15px; margin: 0; line-height: 1.6; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">
              <img src="https://mockpals.com/logo.png" alt="MockPal Logo" />
            </div>
            <div class="header">
              <h1 style="color: #1f2937;">匹配成功啦！🎉</h1>
            </div>
            <p style="color: #374151; font-size: 17px; text-align: center; line-height: 1.6;">你与 <strong>${opts.partnerName}</strong> 已成功匹配，可以开始联系约面了～</p>
            <div class="highlight-box">
              <p class="highlight-text">💡 如果成功联系上对方，记得回来填写<strong>面试反馈</strong>，会获得<strong>优先推荐</strong>的机会哦！</p>
            </div>
            <div style="text-align: center;">
              <a href="${opts.matchesUrl}" class="button">前往查看匹配详情</a>
            </div>
            <p class="tip">如果按钮无法点击，请复制以下链接到浏览器：</p>
            <p style="color: #3b82f6; word-break: break-all; font-size: 14px;">${opts.matchesUrl}</p>
          </div>
        </body>
      </html>
    `;
  
    try {
      const result = await this.resend.emails.send({
        from: fromEmail,
        to,
        subject: 'MockPal - 匹配成功通知',
        html,
      });
      console.log('✅ [EmailService] 匹配成功通知已发送');
      return result;
    } catch (error) {
      console.error('❌ [EmailService] 匹配成功通知发送失败:', error);
      throw error;
    }
  }
  
  // 统一的邮件发送方法
  public async sendVerificationEmail(email: string, url: string) {
    console.log('🔵 [EmailService] 准备发送验证邮件');
    console.log('📧 收件人:', email);
    console.log('🔗 验证链接:', url);
    
    // 开发环境：直接在控制台显示登录链接，不发送邮件
    if (process.env.NODE_ENV === 'development') {
      console.log('\n🚀 [开发环境] 邮件登录链接：');
      console.log('🔗 请复制此链接到浏览器中登录:');
      console.log(url);
      console.log('💡 提示：点击上面的链接即可直接登录，无需检查邮箱\n');
      return { data: { id: 'dev-mode-skip' }, error: null };
    }
    
    // ⚠️ 测试环境配置 - 推送到生产前需要修改回 noreply@mockpals.com
    const isProduction = process.env.NODE_ENV === 'production';
    const fromEmail = isProduction 
      ? 'MockPal <noreply@mockpals.com>'  // 生产环境：使用自定义域名
      : 'MockPal <onboarding@resend.dev>'; // 测试环境：使用Resend验证域名
    
    console.log('📮 发件人:', fromEmail);
    
    if (!isProduction) {
      console.log('⚠️ 警告：当前使用测试环境邮件配置！');
      console.log('🔔 推送到生产前记得检查邮件配置！');
      console.log('💡 注意：Resend免费版只能发送到注册邮箱 (xincindy924@gmail.com)');
    }
    
    try {
      const emailPayload = {
        from: fromEmail,
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
    
    // 开发环境：直接在控制台显示设置密码链接，不发送邮件
    if (process.env.NODE_ENV === 'development') {
      console.log('\n🚀 [开发环境] 设置密码链接：');
      console.log('🔗 请复制此链接到浏览器中设置密码:');
      console.log(url);
      console.log('💡 提示：点击上面的链接即可直接设置密码，无需检查邮箱\n');
      return { data: { id: 'dev-mode-skip' }, error: null };
    }
    
    // ⚠️ 测试环境配置 - 推送到生产前需要修改回 noreply@mockpals.com
    const isProduction = process.env.NODE_ENV === 'production';
    const fromEmail = isProduction 
      ? 'MockPal <noreply@mockpals.com>'  // 生产环境：使用自定义域名
      : 'MockPal <onboarding@resend.dev>'; // 测试环境：使用Resend验证域名
    
    console.log('📮 发件人:', fromEmail);
    
    if (!isProduction) {
      console.log('⚠️ 警告：当前使用测试环境邮件配置！');
      console.log('🔔 推送到生产前记得检查邮件配置！');
      console.log('💡 注意：Resend免费版只能发送到注册邮箱 (xincindy924@gmail.com)');
    }
    
    try {
      const emailPayload = {
        from: fromEmail,
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