import { Resend } from 'resend';
import { db } from '@/lib/db';
import { emailSendLogs } from '@/lib/db/schema';
import { eq, gte, and, count } from 'drizzle-orm';

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
  
  /**
   * 检查邮件发送频率限制
   * 每个用户每周最多收到 2 封邮件
   * @提及邮件每天最多发送 1 封
   */
  private async checkEmailRateLimit(email: string, emailType: string): Promise<{ allowed: boolean; message?: string; sentCount?: number }> {
    try {
      // @提及邮件使用每日限制
      if (emailType === 'mention') {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // 今天开始时间
        
        const result = await db
          .select({ count: count() })
          .from(emailSendLogs)
          .where(
            and(
              eq(emailSendLogs.recipientEmail, email),
              eq(emailSendLogs.emailType, 'mention'),
              gte(emailSendLogs.sentAt, today),
              eq(emailSendLogs.status, 'sent')
            )
          );
        
        const sentCount = result[0]?.count || 0;
        
        if (sentCount >= 1) {
          return {
            allowed: false,
            message: `该邮箱今天已收到 ${sentCount} 封@提及邮件，已达到每日限制（1封）`,
            sentCount,
          };
        }
        
        return { allowed: true, sentCount };
      }
      
      // 其他邮件类型使用每周限制
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      // 查询过去7天内发送给该邮箱的邮件数量
      const result = await db
        .select({ count: count() })
        .from(emailSendLogs)
        .where(
          and(
            eq(emailSendLogs.recipientEmail, email),
            gte(emailSendLogs.sentAt, sevenDaysAgo),
            eq(emailSendLogs.status, 'sent') // 只计算成功发送的
          )
        );
      
      const sentCount = result[0]?.count || 0;
      
      if (sentCount >= 2) {
        return {
          allowed: false,
          message: `该邮箱在过去7天内已收到 ${sentCount} 封邮件，已达到每周限制（2封）`,
          sentCount,
        };
      }
      
      return { allowed: true, sentCount };
    } catch (error) {
      console.error('[EmailService] 检查发送频率失败:', error);
      // 如果检查失败，默认允许发送（避免影响正常业务）
      return { allowed: true };
    }
  }
  
  /**
   * 记录邮件发送
   */
  private async logEmailSend(
    email: string,
    emailType: string,
    subject: string,
    status: 'sent' | 'failed' | 'skipped',
    errorMessage?: string
  ): Promise<void> {
    try {
      await db.insert(emailSendLogs).values({
        recipientEmail: email,
        emailType,
        subject,
        status,
        errorMessage: errorMessage || null,
        sentAt: new Date(),
      });
    } catch (error) {
      console.error('[EmailService] 记录邮件发送失败:', error);
      // 记录失败不影响主流程
    }
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
    
    // 检查发送频率限制
    const rateLimitCheck = await this.checkEmailRateLimit(to, 'match_success');
    if (!rateLimitCheck.allowed) {
      console.log(`⚠️ [EmailService] ${rateLimitCheck.message}`);
      await this.logEmailSend(to, 'match_success', 'MockPal - 匹配成功通知', 'skipped', rateLimitCheck.message);
      return { 
        data: { id: 'rate-limit-skip' }, 
        error: null,
        skipped: true,
        reason: 'rate_limit'
      };
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
      
      // 记录发送成功
      await this.logEmailSend(to, 'match_success', 'MockPal - 匹配成功通知', 'sent');
      
      return result;
    } catch (error) {
      console.error('❌ [EmailService] 匹配成功通知发送失败:', error);
      
      // 记录发送失败
      await this.logEmailSend(
        to, 
        'match_success', 
        'MockPal - 匹配成功通知', 
        'failed', 
        error instanceof Error ? error.message : String(error)
      );
      
      throw error;
    }
  }
  
  // @提及邮件模板
  public async sendMentionEmail(to: string, opts: { 
    actorName: string; 
    content: string; 
    postType: string; 
    postId: number; 
    commentUrl: string;
  }) {
    console.log('🔵 [EmailService] 准备发送@提及通知');
    console.log('📧 收件人:', to);
    console.log('👤 提及者:', opts.actorName);
    console.log('💬 评论内容:', opts.content.slice(0, 50) + '...');
    console.log('🔗 跳转链接:', opts.commentUrl);
  
    // 开发环境：直接打印，不真正发信
    if (process.env.NODE_ENV === 'development') {
      console.log('\n🚀 [开发环境] @提及通知：');
      console.log(`📢 ${opts.actorName} 在评论中提到了你！`);
      console.log(`💬 评论内容: ${opts.content.slice(0, 100)}...`);
      console.log(`🔗 前往查看: ${opts.commentUrl}\n`);
      return { data: { id: 'dev-mode-skip' }, error: null };
    }
    
    // 检查发送频率限制（每日1封）
    const rateLimitCheck = await this.checkEmailRateLimit(to, 'mention');
    if (!rateLimitCheck.allowed) {
      console.log(`⚠️ [EmailService] ${rateLimitCheck.message}`);
      await this.logEmailSend(to, 'mention', 'MockPal - 有人@了你', 'skipped', rateLimitCheck.message);
      return { 
        data: { id: 'rate-limit-skip' }, 
        error: null,
        skipped: true,
        reason: 'rate_limit'
      };
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
            .comment-box { background: #F9FAFB; border-left: 4px solid #3B82F6; padding: 16px; margin: 20px 0; border-radius: 4px; }
            .comment-text { color: #374151; font-size: 15px; margin: 0; line-height: 1.6; }
            .mention-highlight { background: #FEF3C7; padding: 2px 4px; border-radius: 3px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">
              <img src="https://mockpals.com/logo.png" alt="MockPal Logo" />
            </div>
            <div class="header">
              <h1 style="color: #1f2937;">有人@了你！📢</h1>
            </div>
            <p style="color: #374151; font-size: 17px; text-align: center; line-height: 1.6;">
              <strong>${opts.actorName}</strong> 在评论中提到了你
            </p>
            <div class="comment-box">
              <p class="comment-text">💬 "${opts.content.slice(0, 200)}${opts.content.length > 200 ? '...' : ''}"</p>
            </div>
            <div style="text-align: center;">
              <a href="${opts.commentUrl}" class="button">前往查看评论</a>
            </div>
            <p class="tip">如果按钮无法点击，请复制以下链接到浏览器：</p>
            <p style="color: #3b82f6; word-break: break-all; font-size: 14px;">${opts.commentUrl}</p>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
              <p>💡 提示：你可以在个人中心关闭@提及邮件通知</p>
            </div>
          </div>
        </body>
      </html>
    `;
  
    try {
      const result = await this.resend.emails.send({
        from: fromEmail,
        to,
        subject: `MockPal - ${opts.actorName} 在评论中提到了你`,
        html,
      });
      console.log('✅ [EmailService] @提及通知已发送');
      
      // 记录发送成功
      await this.logEmailSend(to, 'mention', `MockPal - ${opts.actorName} 在评论中提到了你`, 'sent');
      
      return result;
    } catch (error) {
      console.error('❌ [EmailService] @提及通知发送失败:', error);
      
      // 记录发送失败
      await this.logEmailSend(
        to, 
        'mention', 
        `MockPal - ${opts.actorName} 在评论中提到了你`, 
        'failed', 
        error instanceof Error ? error.message : String(error)
      );
      
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
    
    // 检查发送频率限制
    const rateLimitCheck = await this.checkEmailRateLimit(email, 'login');
    if (!rateLimitCheck.allowed) {
      console.log(`⚠️ [EmailService] ${rateLimitCheck.message}`);
      await this.logEmailSend(email, 'login', 'MockPal - 登录验证', 'skipped', rateLimitCheck.message);
      // 对于登录邮件，如果超限，抛出错误让用户知道
      throw new Error(`邮件发送已达到限制：${rateLimitCheck.message}`);
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
      
      // 记录发送成功
      await this.logEmailSend(email, 'login', 'MockPal - 登录验证', 'sent');
      
      return result;
    } catch (error) {
      console.error('❌ [EmailService] 邮件发送失败!');
      console.error('🚫 错误详情:', error);
      if (error instanceof Error) {
        console.error('🔍 错误消息:', error.message);
        console.error('📋 错误堆栈:', error.stack);
      }
      
      // 记录发送失败
      await this.logEmailSend(
        email, 
        'login', 
        'MockPal - 登录验证', 
        'failed', 
        error instanceof Error ? error.message : String(error)
      );
      
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
    
    // 检查发送频率限制
    const rateLimitCheck = await this.checkEmailRateLimit(email, 'password_setup');
    if (!rateLimitCheck.allowed) {
      console.log(`⚠️ [EmailService] ${rateLimitCheck.message}`);
      await this.logEmailSend(email, 'password_setup', 'MockPal - 设置密码', 'skipped', rateLimitCheck.message);
      // 对于设置密码邮件，如果超限，抛出错误让用户知道
      throw new Error(`邮件发送已达到限制：${rateLimitCheck.message}`);
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
      
      // 记录发送成功
      await this.logEmailSend(email, 'password_setup', 'MockPal - 设置密码', 'sent');
      
      return result;
    } catch (error) {
      console.error('❌ [EmailService] 设置密码邮件发送失败!');
      console.error('🚫 错误详情:', error);
      
      // 记录发送失败
      await this.logEmailSend(
        email, 
        'password_setup', 
        'MockPal - 设置密码', 
        'failed', 
        error instanceof Error ? error.message : String(error)
      );
      
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